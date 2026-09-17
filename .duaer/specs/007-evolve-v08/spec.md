# Capability evolution v0.8

## Goal

Ship blur filter, stagger.grid, repeatRefresh, onInterrupt, and totalProgress/totalDuration for AI/demo use.

## In scope

1. **blur** — `blur: 12` animates CSS `filter: blur(Npx)` on elements; read/write preserves other filter functions when present
2. **stagger.grid** — `StaggerVars.grid: [cols, rows] | [cols]`; 2D ranks for `from` start|end|center|edges|random|number via `buildStaggerDelays` / `staggerRank`
3. **repeatRefresh** — boolean on `Vars`; before each repeat cycle increase, rebuild start/end from current state (invalidate-style)
4. **onInterrupt** — callback when tween is killed via overwrite (`killAll`) or explicit `kill` (not normal complete); fire once
5. **totalProgress** get/set + **totalDuration** on `TweenControls` — `progress` stays per-iteration; `totalProgress` maps across `totalDuration` including repeats
6. Bump **0.8.0**; tests; Skill sync (`skills/morepass` + `.agents/skills/morepass`); demo buttons

## Out of scope

- Push / promote to main
- Flip / SplitText / Draggable

## Acceptance

- `tests/evolve-v08.test.ts` covers blur / grid / repeatRefresh / onInterrupt / totalProgress
- Demo buttons: blur, grid, repeatRefresh, interrupt, totalProgress
- `npm test` && `npm run build` pass
- `delivery.json` accepted
