# Hollowhaven v0.1 playtest

## Goal
Light three ward lanterns in the daytime. Return to the sanctuary bell and interact to begin the night. Call each lost soul and lead all three back into the sanctuary. Keep away from wraiths, or banish them with two lantern pulses.

## Controls
- WASD or arrow keys: move.
- E: light a ward, ring the bell, or call a nearby soul.
- Space: lantern pulse at night (24 energy, 1.15-second cooldown).
- Shift: run, using lantern energy. Walking regenerates it.
- Escape: pause/resume. M: toggle sound.
- Touch: directional pad plus Call / Light and Pulse buttons.

The sanctuary protects you from damage. Each delivered soul restores one health. You can escort more than one at once. Wraiths and souls are incorporeal and drift through buildings; the player cannot. The night is intentionally forgiving for an initial playtest.

## Verified on 2026-11-08
- `npm run check`: syntax checks and 16 Node tests passed.
- Full simulated playthrough using only normal movement, interaction and pulse calls, with live enemies and spawns. All wards lit, bell rung, all three souls escorted to safety, win reached. No teleporting or health changes in this test.
- A separate normal-walking playthrough without sprint or pulses also completes successfully.
- World boundaries, building and night-barrier collision, reachable objective routes, damage and invulnerability, sanctuary protection, energy/cooldown, loss, win, pause and clean restart are covered.
- Original character asset validator: both RGBA textures and exact hashes passed.
- Real Chromium preview: title and town render, both character images load, movement, premature bell interaction, Escape pause/resume, restart and sound-toggle UI work. No game-origin console errors observed; browser extension logs are unrelated.

## Verification limits
The entire night was completed in the deterministic gameplay tests, not manually played end-to-end in the browser. Touch inputs and responsive styles are implemented and reviewed but have not been tested on a physical phone. Audio was toggled in-browser, not perceptually evaluated. This is a small browser prototype, not a tested multiplayer release.

## Current scope
Single player with Azrik following you. No networked co-op, save system, inventory, quests beyond the first night, rigged animation, controller input, or production asset pipeline. Current front-pose textures are static stand-ins; motion uses positioning, mirroring and bobbing. World art is drawn in code. No external libraries, account system, analytics or network gameplay calls.
