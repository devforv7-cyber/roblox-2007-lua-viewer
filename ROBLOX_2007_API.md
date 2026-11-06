# Roblox 2007-style Lua API compatibility

This project is a standalone browser simulation, not Roblox and not a Roblox client. The planned compatibility layer will expose only a small, safe subset of familiar legacy-style APIs, implemented locally for this demo. It cannot run arbitrary Roblox game scripts or reproduce Roblox networking, services, replication, or engine behavior.

## Intended local API subset

- `Vector3.new(x, y, z)` for position and velocity values
- `Color3.new(r, g, b)` for local colors
- `BrickColor.new(name)` for a small palette of classic colors
- `Instance.new("Part")` to create a local primitive in the demo scene
- `workspace` as the local scene container
- `game:GetService("Players").LocalPlayer.Character` for the demo avatar
- `Humanoid:MoveTo(position)` and `Humanoid.Jump` for local character controls
- `wait()` as a cooperative demo helper

Unsupported services and functions should fail clearly rather than contacting Roblox or executing code from external games. The Lua runtime must expose no browser, network, filesystem, or process APIs, and scripts should be instruction-limited.

## Important

Names and behavior are compatibility-inspired, not official Roblox APIs. No real Roblox 2007 assets or client code are included.
