<!-- EDITING FORMAT: See data/changelog-format-guide.md for every supported style and copy-ready examples. -->

# PalaRivals Watch Development Archive

## Version 0.2.0 — Ability Draft Evolution & Balance Changes
Date: August 20, 2026
Status: Current Build

### Ability Draft
- Added six-slot hero repositioning and occupied-slot swapping.
- Matching heroes can now merge from level 1 through level 4.
- Merged heroes gain additional power and health.
- Heroes with different equipped abilities now create a **fused loadout** that keeps every effect active.
- AI opponents can create leveled heroes and fused ability combinations.
- Added complete hover, focus, and mobile-tap information panels for every unit.

> Ability Draft remains an experimental Arcade mode and will continue receiving balance changes.

### Interface
- Added clearer merge targets, level indicators, progression displays, and fusion styling.
- Improved the Ability Draft layout on desktop and mobile screens.

### Match Intelligence
- Added live opponent scouting from the combatant leaderboard, including formations, hero levels, squad totals, and detected traits.
- Added after-action combat recaps with damage, damage taken, healing, eliminations, critical hits, dodges, ability activations, and survival data for every hero.
- Expanded spectator mode into a live command center: watch every surviving AI build its squad, then follow every remaining battle at the same time.
- AI commanders now recruit, merge, and lock in their teams much faster during the build phase.

### Balance Changes

::: buff Hulk
Ability: Worldbreaker
- After traits and merging were added, Hulk's power gain felt underwhelming. This makes his scaling more threatening.
Stat: Power after Knockout | +2 | +4
:::

::: adjust Spider-Man
Ability: Spider-Sense
- Spider-Man felt inferior to his tier-one counterpart Tracer despite costing more, so his opening damage is becoming an execute effect.
Stat: First-strike Damage | +2 | Removed
Stat: Execute Threshold | None | 35% Health
Stat: Execute Damage | None | +3
:::

::: buff Thor
Ability: God of Thunder
- Thor did not have a clear place in the game, so we are testing a higher critical rate.
Stat: Critical Chance | 8% | 18%
:::

::: nerf Tracer
Ability: Blink Recall
- Tracer has become the strongest tier-one character with her ability and Overwatch trait, so we are reducing her maneuverability.
Stat: Dodge Chance | 25% | 18%
:::

::: buff Moji
Ability: Familiar Feast
- Moji was weak compared with other tier-one units. These changes increase her execution capabilities.
Stat: Execute Threshold | 40% Health | 50% Health
Stat: Execute Damage | +4 | +8
:::

::: buff Raum
Ability: Soul Armor
- Traits and merging caused Raum to fall behind, so his tier-four presence is becoming more threatening.
Stat: Lifesteal | 20% | 25%
:::

::: buff Seris
Ability: Soul Collector
- Seris had low survivability, so her knockout recovery has been increased slightly.
Stat: Health after Knockout | +2 | +3
:::
