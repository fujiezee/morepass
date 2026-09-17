# MorePass

A small, modern tween library — built so **AI agents learn it in one Skill**, and humans ship motion without fighting the stack.

**v0.5.0** · TypeScript · timeline · keyframes · quickTo · context · delayedCall · clearProps · attr · CSS vars · killTweensOf · getProperty · autoAlpha · timeScale · stagger · scrollTrigger · matchMedia · utils

```bash
npm install morepass
```

## For AI agents (start here)

Copy or open the Agent Skill — one file is enough to use the full API:

- [`skills/morepass/SKILL.md`](skills/morepass/SKILL.md) — decision tree, recipes, API map
- [`skills/morepass/examples.md`](skills/morepass/examples.md) — extra patterns

Host mirrors (same content): `.agents/skills/morepass/`, `.cursor/skills/morepass/`, `.claude/skills/morepass/`.

When animating in a project that depends on `morepass`, **read that Skill first** instead of inventing RAF/CSS keyframe loops.

## Quick start

```ts
import MorePass from "morepass"

MorePass.to(".box", {
  x: 520,
  rotation: 180,
  backgroundColor: "#f0c14a",
  duration: 1,
  ease: "power2.out",
})

MorePass.timeline()
  .to(".a", { x: 200, duration: 0.6 })
  .to(".b", { opacity: 1, duration: 0.4 }, "-=0.2")
```

## Features

| API | Notes |
|---|---|
| `to` / `from` / `fromTo` / `set` | Core tweens |
| `timeline()` | Sequencing, labels, `+=` / `-=` / `<` / `>` |
| `keyframes` | Array or `"0%"` / `"50%"` / `"100%"` maps |
| `quickTo` | Fast property retarget (pointer follow) |
| `context` | Auto-collect tweens; `revert()` on unmount |
| `delayedCall` | Run a callback after a delay |
| `clearProps` | Strip inline styles when the tween completes |
| `attr` | Animate SVG / HTML attributes |
| CSS variables | Animate `"--token"` style properties |
| `killTweensOf` / `isTweening` | Kill or query by target |
| `getProperty` | Read current transform / style / object value |
| `autoAlpha` | Opacity + visibility |
| `timeScale` / `repeatDelay` / `onRepeat` | Playback control |
| `defaults` | Global tween defaults |
| `paused` + `progress` / `seek` | Scrub UIs without nested scroll |
| `stagger` | `0.1` or `{ each, amount, from }` + function values |
| `scrollTrigger` | scrub, once, pin, toggleActions, custom scroller |
| `matchMedia()` | responsive animation contexts |
| `utils` | clamp, mapRange, interpolate, snap, random, wrap, distribute |
| Transforms | `x y scale rotation …` via shared transform bag |
| Colors | hex / rgb(a) / named |
| Overwrite | default `"auto"` |

```ts
MorePass.to(".box", {
  x: 400,
  scrollTrigger: {
    trigger: ".section",
    start: "top 80%",
    end: "bottom 20%",
    scrub: true,
    pin: true,
    once: true,
  },
})

const setX = MorePass.quickTo(".dot", "x", { duration: 0.35 })
setX(240)

MorePass.matchMedia({
  "(min-width: 800px)": () => {
    const tw = MorePass.to(".hero", { x: 100, duration: 1 })
    return () => tw.kill()
  },
})
```

## Develop

```bash
npm install
npm run dev      # demo at http://127.0.0.1:5173
npm test
npm run build
```

This repo uses [duaer-spec](https://www.npmjs.com/package/duaer-spec) for agent delivery workflow.

## License

MIT
