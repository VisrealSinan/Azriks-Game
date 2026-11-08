# Hollowhaven v0.3 playtest

## Goal
Light three ward lanterns in the daytime. Return to the sanctuary bell and interact to begin the night. Call each lost soul and lead all three back into the sanctuary. Keep away from wraiths, or banish them with two lantern pulses.

## Controls
- WASD or arrow keys: move.
- E: light a ward, ring the bell, call a nearby soul, speak to a resident, or gather a memory.
- Space: lantern pulse at night (24 energy, 1.15-second cooldown).
- Q: call Azrik’s shelter for 3 seconds, protecting you and souls within 175 world units. The 18-second cooldown is separate from lantern energy.
- Shift: run, using lantern energy. Walking regenerates it.
- J: open the journal (pauses the game). Escape: pause/resume or close the journal. M: toggle sound.
- Touch: directional pad plus Call / Light, Pulse and Guardian buttons.

The sanctuary protects you from damage. Each delivered soul restores one health. You can escort more than one at once. Wraiths and souls are incorporeal and drift through buildings; the player cannot. Story mode retains the original forgiving night. Nightwatch adds charge-telegraphing hounds and souls that can be scattered by enemy contact. Scattered souls can always be recalled with E. Hounds take three pulses and commit to a fixed direction after their amber warning.

## Verified on 2026-11-08
- `npm run check`: syntax checks and 37 gameplay/UI tests passed.
- Full simulated playthrough using only normal movement, interaction and pulse calls, with live enemies and spawns. All wards lit, bell rung, all three souls escorted to safety, win reached. No teleporting or health changes in this test.
- A separate normal-walking playthrough without sprint or pulses also completes successfully.
- World boundaries, building and night-barrier collision, reachable objective routes, damage and invulnerability, sanctuary protection, energy/cooldown, loss, win, pause and clean restart are covered.
- Original character asset validator: both RGBA textures and exact hashes passed.
- Real Chromium preview: title and town render, both character images load, movement, premature bell interaction, Escape pause/resume, restart and sound-toggle UI work. No game-origin console errors observed; browser extension logs are unrelated.

- Two complete movement-only playthroughs gather all nine journal entries and win, collecting memories by day or by night.
- Memory pickups and journal entries are idempotent; resident dialogue cycles. Upgraded pulses reach 203/221/239 world units while preserving cost/cooldown.
- Actual browser journal opening, closing with Escape, and prior-pause restoration were checked. The same control handlers also pass a mocked-DOM regression harness, including after victory and restart.

- Nightwatch mode selection, start and replay were checked in the browser. A temporary, non-shipped renderer fixture verified the hound warning lane and active shield visuals.
- Hound telegraph/fixed aim/recovery, guardian duration/cooldown, protected soul escorts and scattering/recall have dedicated tests. A complete realistic Nightwatch run wins with live enemies and normal movement/pulse/guard inputs.
- A scatter-inside-building softlock found during QA was fixed and covered by pathfinding, recall and escort regression.

## Verification limits
The entire night was completed in the deterministic gameplay tests, not manually played end-to-end in the browser. Touch inputs and responsive styles are implemented and reviewed but have not been tested on a physical phone. Audio was toggled in-browser, not perceptually evaluated. This is a small browser prototype, not a tested multiplayer release.

## Current scope
Single player with Azrik following you. No networked co-op, save system, inventory, quests beyond the first night, rigged animation, controller input, or production asset pipeline. Current front-pose textures are static stand-ins; motion uses positioning, mirroring and bobbing. World art is drawn in code. No external libraries, account system, analytics or network gameplay calls.
