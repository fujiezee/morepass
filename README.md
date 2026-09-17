# MorePass

A small, modern tween library — GSAP-inspired API without the weight.

**gzip ≈ 7KB** · TypeScript · timeline · overwrite · colors

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
| Transforms | `x y scale rotation …` via shared transform bag |
| Colors | hex / rgb(a) / named → `backgroundColor`, `color`, … |
| Overwrite | default `"auto"` — only conflicting props |
| Playback | `play pause seek progress kill reverse restart` |

## Develop

```bash
npm install
npm run dev      # demo at http://127.0.0.1:5173
npm test
npm run build
```

This repo uses [duaer-spec](https://www.npmjs.com/package/duaer-spec) for agent delivery workflow (`npx duaer-spec update`).

## License

MIT
