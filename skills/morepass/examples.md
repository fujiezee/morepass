# MorePass examples

Read only when the main skill recipe is not enough.

## Object tween + seek

```ts
import { to } from "morepass"

const state = { p: 0 }
const tw = to(state, { p: 100, duration: 1, ease: "none", paused: true })
tw.seek(0.5)      // state.p === 50
tw.progress(1)    // state.p === 100
```

## from / fromTo

```ts
import MorePass from "morepass"

MorePass.from(".card", {
  y: 40, opacity: 0, duration: 0.6, ease: "power2.out",
})

MorePass.fromTo(
  ".card",
  { x: -80, opacity: 0 },
  { x: 0, opacity: 1, duration: 0.7, ease: "power3.out" },
)
```

## Yoyo loop

```ts
MorePass.to(".pulse", {
  scale: 1.08, duration: 0.5, ease: "sine.inOut",
  repeat: -1, yoyo: true,
})
```

## Stagger with function values

```ts
MorePass.to(".item", {
  x: (i) => i * 12,
  opacity: 1,
  duration: 0.35,
  stagger: { amount: 0.6, from: "end" },
})
```

## Overwrite collision

```ts
MorePass.to(el, { x: 400, y: 20, duration: 2 })
// 0.3s later — only x is taken over; y continues
MorePass.to(el, { x: 100, duration: 0.8, delay: 0.3 })
```

## Nested scroller ScrollTrigger

```ts
const scroller = document.querySelector(".panel")!
MorePass.to(".box", {
  x: 300,
  scrollTrigger: {
    trigger: ".box",
    scroller,
    start: "top 80%",
    end: "top 20%",
    scrub: 0.5,
  },
})
```

## Keyframes scrub UI

```ts
const tl = MorePass.to(box, {
  paused: true,
  duration: 0.6,
  ease: "none",
  keyframes: [
    { x: 120 },
    { x: 260, y: -40, backgroundColor: "#5ad39a" },
    { x: 400, y: 0, rotation: 180, backgroundColor: "#f0c14a" },
  ],
})
slider.oninput = () => tl.progress(Number(slider.value) / 1000)
```

## Cleanup pattern (SPA)

```ts
let current: ReturnType<typeof MorePass.to> | null = null

function enter() {
  current?.kill()
  current = MorePass.to(".page", { opacity: 1, duration: 0.4 })
}

function leave() {
  current?.kill()
  current = null
}
```

## What MorePass is not

- No timeline visual editor
- No text splitting / morph SVG / physics plugins
- `scrollTrigger` covers scrub / once / pin / toggleActions / custom scroller — keep demos on that surface
