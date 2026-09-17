# Baseline (MorePass)

Frozen decisions for MorePass.

## Branch model (mandatory)

| Branch | Role |
|---|---|
| `main` | Production / published releases |
| `develop` | Day-to-day integration |
| `feat/<name>` | Features |
| `fix/<name>` | Bug fixes |

## Product

- **Name:** MorePass
- **Type:** TypeScript animation / tween library (npm package)
- **Runtime:** Browser + plain objects (no framework required)
- **Bundle target:** small core (currently ~7KB gzip)

## Stack

- TypeScript + Vite (library mode)
- Vitest + jsdom
- Dual publish: ESM (`morepass.js`) + CJS (`morepass.cjs`) + `.d.ts`

## Architecture boundaries

- `src/ticker.ts` — rAF clock
- `src/ease.ts` — easing functions
- `src/prop.ts` — numeric props + shared transform bag
- `src/color.ts` — color parse / mix
- `src/overwrite.ts` — property ownership
- `src/tween.ts` — tween engine + public `to/from/fromTo/set`
- `src/timeline.ts` — timeline orchestration
- `src/index.ts` — `MorePass` facade

Do not add ScrollTrigger-scale plugins into core without an optional entrypoint.

## Integration branch

`develop`
