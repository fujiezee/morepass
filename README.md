# MorePass

A small, modern tween library — GSAP-inspired API, built so **AI agents can learn it fast**.

**v0.3.0** · TypeScript · timeline · keyframes · quickTo · stagger · ScrollTrigger · matchMedia · utils

```bash
npm install morepass
```

## For AI agents (start here)

Copy or open the Agent Skill — one file is enough to use the full API:

- [`skills/morepass/SKILL.md`](skills/morepass/SKILL.md) — decision tree, recipes, GSAP cheat sheet
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
| `paused` + `progress` / `seek` | Scrub UIs without nested scroll |
| `stagger` | `0.1` or `{ each, amount, from }` + function values |
| `scrollTrigger` | scrub, once, pin, toggleActions, custom scroller |
| `matchMedia()` | responsive animation contexts |
| `utils` | clamp, mapRange, interpolate, snap, random |
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
