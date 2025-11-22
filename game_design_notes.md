# The Special Order - Game Design Notes

## Overview
"The Special Order" is a platformer game where you play as a Chef fighting through a kitchen to get your lunch (a "Perfect Taco").
**Theme**: "No Onions" / Kitchen Nightmare.

## Core Mechanics
- **Movement**: Walk (Arrow Keys/WASD), Jump (Space/Up/W).
- **Run**: Hold Shift (or 'B' on touch) to sprint. Requires **Coffee** power-up.
- **Shoot**: Press 'X' (or 'B' on touch) to fire Hot Sauce projectiles. Requires **Hot Sauce** power-up.
- **Wall Jump**: Slide down walls and jump off them. Requires **Wall Jump Gloves** power-up.
- **Health**: One-hit death (unless invulnerable/shielded - currently one-hit).
- **Score**: Points for killing enemies and completing levels. Score persists but resets to level start on death.

## Power-ups
- **Hot Sauce (`H`)**: Enables shooting projectiles (`X`). Cleared between levels.
- **Coffee (`E`)**: Enables sprinting (`Shift`). Cleared between levels.
- **Wall Jump Gloves (`W`)**: Enables wall jumping. Cleared between levels.

## Enemies
- **Onion (`O`)**: Patrolling enemy.
- **Cilantro (`C`)**: Spiky enemy, cannot be stomped (instant death).
- **Salt (`A`)**: Standard enemy.
- **Bosses**: Large enemies with health bars.

## Bosses
- **Smash Boss (`B`)**: Basic boss. Hovers and smashes down.
- **Fast Boss (`F`)**: Moves quickly and dashes horizontally.
- **Ranged Boss (`R`)**: Hovers and shoots projectiles. Swoops down low to attack.
- **Final Boss (`X`)**: "The Head Chef" (Gordon Ramsey-esque).
    - **Phase 1**: Standard attacks.
    - **Phase 2**: Enraged (`👹`). Moves faster, tosses minions (Onion, Salt, Cilantro).

## Levels
Total Levels: 16 (4 Worlds)

### World 1: The Prep Station
- Basic platforming.
- **Level 4**: Boss Battle (Smash Boss).

### World 2: The Fryer
- Verticality, Salt enemies.
- **Level 8**: Boss Battle (Fast Boss).

### World 3: The Walk-in
- Precision jumps, Cilantro swarms.
- **Level 12**: Boss Battle (Ranged Boss).

### World 4: The Pass
- "Kaizo"-lite difficulty, tight gaps.
- **Level 16**: Final Boss Battle.

## Technical Details
- **Engine**: Custom TypeScript engine (`engine/` directory).
    - `GameEngine`: Main loop.
    - `PhysicsSystem`: Collision, gravity, movement.
    - `AISystem`: Enemy and Boss behavior.
    - `RenderSystem`: Canvas drawing.
    - `LevelManager`: Level parsing.
    - `InputManager`: Keyboard/Touch handling.
- **Framework**: React (Vite).
- **State Management**: React state for UI, internal mutable state for Game Engine.
- **Level Format**: ASCII art strings in `constants.ts`.
- **Level Editor**: Built-in editor to modify and test levels at runtime.

## Recent Changes (Verified)
- **Ranged Boss**: Swoops lower (`targetY = player.pos.y - 60`) and fires projectiles while swooping.
- **Wall Jump**: Implemented with wall slide and kickback.
- **Boss Hitboxes**: Standardized/Tuned.
- **Touch Controls**: Virtual D-Pad and Buttons.
