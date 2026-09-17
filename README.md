# MorePass

A small, modern tween library — GSAP-inspired API without the weight.

**v0.2.0** · TypeScript · timeline · stagger · ScrollTrigger · matchMedia · utils

```bash
npm install morepass
```

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
| `stagger` | `0.1` or `{ each, amount, from }` + function values |
| `scrollTrigger` | scrub, once, pin, toggleActions, callbacks |
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
