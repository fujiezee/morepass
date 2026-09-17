# Capability evolution v0.6

## Goal

Ship relative values and layout-friendly transform helpers that AI/demo use constantly.

## In scope

- Relative end values: `"+=40"`, `"-=20"`, `"*=2"`
- `xPercent` / `yPercent`
- `transformOrigin`
- `stagger.from: "random"`
- Tween `id` + `MorePass.getById(id)`
- Skill + demo sync · bump **0.6.0**

## Out of scope

- Push (not requested this turn)
- Flip / SplitText / Draggable

## Acceptance

- Unit tests for new APIs
- Demo buttons for relative / percent / getById
- `npm test` && `npm run build` pass
