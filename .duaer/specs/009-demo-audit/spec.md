# Demo audit fix (v0.7–v0.9)

## Goal
Fix demo bugs found while auditing MorePass v0.7–v0.9 features so every advertised demo animates correctly.

## In scope
- Align clipPath demo live tween with `inset(... round 16px)` show string
- Harden demo teardown (orphan delayed tweens, totalProgress RAF)
- Add unit coverage for clipPath `round` keyword

## Out of scope
- New library features beyond making advertised demos honest
- Remote push / promote to main

## Acceptance
- clipPath demo animates with `round 16px` in both snippet and tween
- Switching demos kills secondary overwrite/interrupt tweens
- totalProgress scrub stops when leaving the demo
- `npm test` and `npm run build` pass
