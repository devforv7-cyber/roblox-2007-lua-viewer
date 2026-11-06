const statusEl = document.getElementById('status');
const luaCodeEl = document.getElementById('luaCode');
const runButton = document.getElementById('runLua');
const resetButton = document.getElementById('resetScene');

let world;
let player;
let playerBody;
let playerMaterial;
let lastTime = performance.now();
const pressed = {};

function setStatus(message) {
  statusEl.textContent = `Status: ${message}`;
}

function buildScene() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x8fc2ff);
  scene.fog = new THREE.Fog(0x8fc2ff, 18, 60);

  const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 200);
  camera.position.set(12, 7, 14);
  scene.userData.camera = camera;

  const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('scene'), antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  scene.userData.renderer = renderer;

  const ambient = new THREE.HemisphereLight(0xffffff, 0x425c7d, 1.25);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(9, 12, 8);
  scene.add(sun);

  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(30, 1, 30),
    new THREE.MeshStandardMaterial({ color: 0x79a86f, roughness: 0.9, metalness: 0.05 })
  );
  floor.position.y = -0.5;
  scene.add(floor);

  const floorBody = new CANNON.Body({ mass: 0 });
  floorBody.addShape(new CANNON.Box(new CANNON.Vec3(15, 0.5, 15)));
  floorBody.position.set(0, -0.5, 0);
  world.addBody(floorBody);

  const blockDefinitions = [
    { x: -6, y: 1, z: 0, w: 2, h: 2, d: 4, color: 0x8da7ff },
    { x: 0, y: 2, z: -7, w: 3, h: 4, d: 3, color: 0xffc66d },
    { x: 5, y: 1.5, z: 3, w: 4, h: 3, d: 2, color: 0xf28181 },
    { x: 8, y: 4, z: -3, w: 2, h: 8, d: 2, color: 0xa4d7c5 }
  ];

  blockDefinitions.forEach((cfg) => {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(cfg.w, cfg.h, cfg.d),
      new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.8, metalness: 0.15 })
    );
    mesh.position.set(cfg.x, cfg.y, cfg.z);
    scene.add(mesh);

    const b = new CANNON.Body({ mass: 0 });
    b.addShape(new CANNON.Box(new CANNON.Vec3(cfg.w / 2, cfg.h / 2, cfg.d / 2)));
    b.position.set(cfg.x, cfg.y, cfg.z);
    world.addBody(b);
  });

  const group = new THREE.Group();
  const torsoMaterial = new THREE.MeshStandardMaterial({ color: 0x00a0ff, roughness: 0.7, metalness: 0.2 });
  playerMaterial = torsoMaterial;

  const torso = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.7, 0.6), torsoMaterial);
  torso.position.y = 0.4;
  group.add(torso);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 18, 18),
    new THREE.MeshStandardMaterial({ color: 0xf6d2b3, roughness: 0.7 })
  );
  head.position.y = 1.7;
  group.add(head);

  const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.2, 0.35), torsoMaterial);
  leftArm.position.set(-0.95, 0.55, 0);
  group.add(leftArm);

  const rightArm = leftArm.clone();
  rightArm.position.x = 0.95;
  group.add(rightArm);

  const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.3, 0.45), new THREE.MeshStandardMaterial({ color: 0x2d3748, roughness: 0.9 }));
  leftLeg.position.set(-0.3, -1.1, 0);
  group.add(leftLeg);

  const rightLeg = leftLeg.clone();
  rightLeg.position.x = 0.3;
  group.add(rightLeg);

  scene.add(group);

  const avatarBody = new CANNON.Body({ mass: 5 });
  avatarBody.addShape(new CANNON.Sphere(0.6));
  avatarBody.position.set(0, 2.5, 0);
  avatarBody.linearDamping = 0.25;
  avatarBody.angularDamping = 0.35;
  world.addBody(avatarBody);

  player = group;
  playerBody = avatarBody;

  const tick = () => {
    const now = performance.now();
    const dt = Math.min((now - lastTime) / 1000, 0.033);
    lastTime = now;

    updatePlayer(dt);
    world.step(1 / 60, dt, 3);

    player.position.set(playerBody.position.x, playerBody.position.y, playerBody.position.z);

    const camera = scene.userData.camera;
    const target = new THREE.Vector3(player.position.x, player.position.y + 1.2, player.position.z);
    camera.position.x += (player.position.x + 8 - camera.position.x) * 0.04;
    camera.position.y += (player.position.y + 5 - camera.position.y) * 0.04;
    camera.position.z += (player.position.z + 8 - camera.position.z) * 0.04;
    camera.lookAt(target);

    scene.userData.renderer.render(scene, camera);
    requestAnimationFrame(tick);
  };

  requestAnimationFrame(tick);
}

function updatePlayer(dt) {
  const moveX = (pressed.KeyD ? 1 : 0) - (pressed.KeyA ? 1 : 0);
  const moveZ = (pressed.KeyS ? 1 : 0) - (pressed.KeyW ? 1 : 0);

  if (moveX || moveZ) {
    const speed = 7;
    const vec = new THREE.Vector3(moveX, 0, moveZ).normalize();
    playerBody.velocity.x = vec.x * speed;
    playerBody.velocity.z = vec.z * speed;
  } else {
    playerBody.velocity.x *= 0.9;
    playerBody.velocity.z *= 0.9;
  }

  if (pressed.Space && playerBody.position.y < 1.7) {
    playerBody.velocity.y = 7.5;
  }
}

function movePlayer(direction, speedValue) {
  const dir = String(direction || 'forward').toLowerCase();
  const speed = Number(speedValue) || 4;

  if (dir === 'forward') {
    playerBody.velocity.z = -speed;
  } else if (dir === 'backward') {
    playerBody.velocity.z = speed;
  } else if (dir === 'left') {
    playerBody.velocity.x = -speed;
  } else if (dir === 'right') {
    playerBody.velocity.x = speed;
  } else if (dir === 'up') {
    playerBody.velocity.y = speed;
  }
}

function jumpPlayer() {
  if (playerBody.position.y < 1.6) {
    playerBody.velocity.y = 7.5;
    setStatus('jump');
  }
}

function setPlayerColor(r, g, b) {
  const red = Math.max(0, Math.min(255, Number(r) || 255)) / 255;
  const green = Math.max(0, Math.min(255, Number(g) || 255)) / 255;
  const blue = Math.max(0, Math.min(255, Number(b) || 255)) / 255;
  playerMaterial.color.setRGB(red, green, blue);
}

function resetScene() {
  playerBody.position.set(0, 2.5, 0);
  playerBody.velocity.set(0, 0, 0);
  player.rotation.set(0, 0, 0);
  setStatus('scene reset');
}

function initInput() {
  document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
      event.preventDefault();
    }
    pressed[event.code] = true;
  });

  document.addEventListener('keyup', (event) => {
    pressed[event.code] = false;
  });
}

function runLuaScript(source) {
  if (!window.fengari) {
    setStatus('Fengari failed to load');
    return;
  }

  const L = fengari.lua.luaL_newstate();
  fengari.lualib.luaL_openlibs(L);

  function bind(name, fn) {
    fengari.lua.lua_pushcfunction(L, function(luaState) {
      const argc = fengari.lua.lua_gettop(luaState);
      const args = [];

      for (let i = 1; i <= argc; i += 1) {
        const type = fengari.lua.lua_type(luaState, i);
        if (type === fengari.lua.LUA_TNUMBER) {
          args.push(fengari.lua.lua_tonumber(luaState, i));
        } else if (type === fengari.lua.LUA_TSTRING) {
          args.push(fengari.to_jsstring(fengari.lua.lua_tostring(luaState, i)));
        } else if (type === fengari.lua.LUA_TBOOLEAN) {
          args.push(Boolean(fengari.lua.lua_toboolean(luaState, i)));
        } else {
          args.push(null);
        }
      }

      const result = fn(...args);

      if (typeof result === 'number') {
        fengari.lua.lua_pushnumber(luaState, result);
        return 1;
      }

      if (typeof result === 'string') {
        fengari.lua.lua_pushstring(luaState, fengari.to_luastring(result));
        return 1;
      }

      if (typeof result === 'boolean') {
        fengari.lua.lua_pushboolean(luaState, result);
        return 1;
      }

      return 0;
    });

    fengari.lua.lua_setglobal(L, name);
  }

  bind('move', (direction, speed) => movePlayer(direction, speed));
  bind('jump', () => jumpPlayer());
  bind('say', (text) => setStatus(String(text)));
  bind('setColor', (r, g, b) => setPlayerColor(r, g, b));
  bind('print', (...args) => setStatus(args.join(' ')));

  const result = fengari.lauxlib.luaL_dostring(L, fengari.to_luastring(source));
  if (result !== fengari.lua.LUA_OK) {
    const errorText = fengari.to_jsstring(fengari.lua.lua_tostring(L, -1));
    setStatus(`Lua error: ${errorText}`);
  }
}

window.addEventListener('load', () => {
  world = new CANNON.World();
  world.gravity.set(0, -18, 0);
  world.broadphase = new CANNON.NaiveBroadphase();
  buildScene();
  initInput();

  runButton.addEventListener('click', () => {
    runLuaScript(luaCodeEl.value);
  });

  resetButton.addEventListener('click', () => {
    resetScene();
  });

  setStatus('ready');
});
