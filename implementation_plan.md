# Implementation Plan - Add World 3 ("The Steamer")

## Goal
Insert a new "World 3" between the current World 2 and World 3. This new world will feature:
- **Cloud Platforms**: Jump through from bottom, solid from top.
- **Moving Platforms**: Vertical and Horizontal movement.
- **New Boss**: A unique boss at the end of the world.

## User Review Required
> [!IMPORTANT]
> This change increases the total level count from 16 to 20. Existing World 3 and 4 will become World 4 and 5.

## Proposed Changes

### Types & State
#### [MODIFY] [types.ts](file:///Users/benmckenzie/Code/the-special-order/types.ts)
- Add `PLATFORM_CLOUD`, `PLATFORM_MOVING` to `EntityType`.
- Add `moveAxis` ('x' | 'y') and `startPos` to `Entity` for moving platforms.

### Constants & Level Design
#### [MODIFY] [constants.ts](file:///Users/benmckenzie/Code/the-special-order/constants.ts)
- Add Emojis: Cloud `☁️`, Moving Platform `🛹` (or similar), New Boss `🥟` (Dumpling).
- Define Characters:
    - `=`: Cloud Platform
    - `-`: Moving Platform (Horizontal)
    - `|`: Moving Platform (Vertical)
    - `D`: Dumpling Boss
- Create `LEVEL_9`, `LEVEL_10`, `LEVEL_11`, `LEVEL_12_BOSS` (New World 3).
- Rename/Shift existing levels:
    - `LEVEL_9` -> `LEVEL_13`
    - `LEVEL_10` -> `LEVEL_14`
    - ...and so on.
- Update `LEVELS` array to include the new set in the correct order.

### Engine Logic
#### [MODIFY] [engine/LevelManager.ts](file:///Users/benmckenzie/Code/the-special-order/engine/LevelManager.ts)
- Update parsing logic to handle `=`, `-`, `|`, and `D`.
- Initialize moving platforms with velocity and `startPos`.

#### [MODIFY] [engine/PhysicsSystem.ts](file:///Users/benmckenzie/Code/the-special-order/engine/PhysicsSystem.ts)
- **Cloud Collision**: Update `checkCollision` or `resolvePlatformCollision` to only register hit if `player.vel.y > 0` and `player.bottom <= platform.top`.
- **Moving Platforms**:
    - Update platform positions in `update()`.
    - Implement "Carrying" logic: If player is on top of a moving platform, apply the platform's velocity to the player.

#### [MODIFY] [engine/AISystem.ts](file:///Users/benmckenzie/Code/the-special-order/engine/AISystem.ts)
- Add logic for the new **Dumpling Boss** (`D`).
    - Maybe it jumps around or spawns clouds?
    - Let's make it a "Bouncy" boss that jumps high and tries to land on you.

## Verification Plan
### Automated Tests
- None (Visual/Gameplay verification required).

### Manual Verification
- **Cloud Platforms**: Jump up through them, land on them. Press 'Down' to drop through? (Optional, but standard).
- **Moving Platforms**: Stand on them, ensure player moves with them. Ensure they reverse direction correctly.
- **Level Progression**: Verify Level 8 -> Level 9 (New) -> ... -> Level 12 (New Boss) -> Level 13 (Old World 3).
