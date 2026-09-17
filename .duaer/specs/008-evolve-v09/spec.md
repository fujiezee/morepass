# Capability evolution v0.9

## Goal

Ship clipPath string interpolation, stagger.axis, extra eases (elastic/bounce in variants + steps), onOverwrite, and vars.data for AI/demo use.

## In scope

1. **clipPath** — animate string `clip-path` with the same function shape; support `inset(...)` and `circle(...)` by parsing numbers, interpolating, writing back the same template; prop key `clipPath` → CSS `clip-path`
2. **stagger.axis** — `StaggerVars.axis?: "x" | "y"`; with `grid`, rank by column (x) or row (y) for delay ordering; works with `from` start|end|center|edges|random|number
3. **Eases** — add `elastic.in`, `elastic.inOut`, `bounce.in`, `bounce.inOut`; add `steps(n)` via ease string like `"steps(6)"` or `"steps(6, jump-end)"`; extend `EaseName` / `resolveEase`
4. **onOverwrite** — callback when this tween loses props via overwrite (`claimProps` → `killProps` / `killAll`); distinct from `onInterrupt` (full kill); prefer once per overwrite event
5. **data** — `vars.data` any; `TweenControls` has `data` get/set; Timeline too if easy; store on instance
6. Bump **0.9.0**; `tests/evolve-v09.test.ts`; Skill sync (`skills/morepass` + `.agents/skills/morepass`); demo buttons: clipPath, axis, steps, overwriteCb (or onOverwrite), data

## Out of scope

- Push / promote to main
- Flip / SplitText / Draggable
- Other clip-path shapes beyond inset/circle (ellipse/path/polygon may work if number slots match, not required)

## Acceptance

- `tests/evolve-v09.test.ts` covers clipPath / axis / eases / onOverwrite / data
- Demo buttons wired; cinematic panel UX preserved
- `npm test` && `npm run build` pass
- Commit, merge to local `develop`, remove worktree; do not push
- `delivery.json` accepted
