# Capability evolution v0.7

## Goal

Ship function end values, snap, then()/invalidate, and skew coverage for AI/demo use.

## In scope

- Function-based end values `x: () => n` resolved at build / invalidate (plain to/from/fromTo; stagger already maps)
- `snap: { x: 10 }` or `snap: { x: [0, 50, 100] }` after interpolate via `utils.snap`
- `then()` PromiseLike on tween and timeline — resolve on complete and on kill
- `invalidate()` rebuilds start/end from current state; store raw vars for rebuild
- skewX / skewY tests + demo + Skill (already in prop.ts)
- Bump **0.7.0**; sync skills/morepass + .agents/skills/morepass; demo buttons

## Out of scope

- Push / promote to main
- Flip / SplitText / Draggable

## Acceptance

- `tests/evolve-v07.test.ts` covers function / snap / then / invalidate / skew
- Demo buttons for function / snap / then / invalidate / skew
- `npm test` && `npm run build` pass
- `delivery.json` accepted
