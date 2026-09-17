# Capability evolution (v0.4)

## Goal

Grow MorePass toward the motion APIs AI reaches for most when wiring real UIs:
scoped cleanup, kill-by-target, property readback, autoAlpha, and timeScale.

## Assumptions (ask was “能力进化”)

Ship one coherent API slice; skip Flip / SplitText / Draggable.

## In scope

- `context(fn)` with auto-collect + `revert()` / `kill()`
- `killTweensOf(target, props?)` + `isTweening(target)`
- `getProperty(target, prop)`
- `autoAlpha` (opacity + visibility)
- `timeScale` on tween / timeline controls
- `repeatDelay` + working `onRepeat`
- Optional global `defaults(vars)`
- Demo hooks + Skill / README sync · bump **0.4.0**

## Out of scope

- Flip, SplitText, MorphSVG, Draggable
- ScrollTrigger feature depth beyond scrub / once / pin / toggleActions / custom scroller
- npm publish / push unless asked

## Acceptance

- [ ] New APIs exported on `MorePass` and covered by unit tests
- [ ] Skill + README list the new APIs
- [ ] `npm test` && `npm run build` pass
