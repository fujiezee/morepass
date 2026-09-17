# Capability evolution v0.5

## Goal

Ship the next high-leverage motion APIs and push `develop` to origin.

## In scope

- `delayedCall(delay, fn)`
- `clearProps` (string / `"all"`) on tween complete
- `attr: { ... }` for SVG / element attributes
- CSS custom properties (`"--x": 10`)
- `utils.wrap` + `utils.distribute`
- Skill / README sync · bump **0.5.0**
- Push local `develop` to `origin` (user asked)

## Out of scope

- Promote to `main` / npm publish
- Flip / SplitText / Draggable

## Acceptance

- Unit tests cover new APIs
- Skill lists them
- `npm test` && `npm run build` pass
- `origin/develop` updated
