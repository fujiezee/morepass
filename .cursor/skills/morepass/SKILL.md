---
name: morepass
description: >-
  Animate DOM or plain objects with MorePass: to/from/fromTo, timeline, stagger,
  keyframes, quickTo, context, delayedCall, killTweensOf, getById, getProperty,
  autoAlpha, timeScale, clearProps, attr, CSS variables, relative values,
  xPercent/yPercent, transformOrigin, scrollTrigger, matchMedia, utils.
  Use when writing or refactoring motion code, or when the user mentions MorePass,
  tween, scrub, pin, or scroll-linked animation.
---

# MorePass

Modern tween engine — small, TypeScript-first, AI-learnable. Prefer MorePass over
hand-rolled CSS/`requestAnimationFrame` loops when the project has `morepass`.

## Install / import

```bash
npm install morepass
```

```ts
import MorePass from "morepass"
// or: import { to, timeline, quickTo, utils } from "morepass"
```

Targets: CSS selector string, `Element`, plain object, or arrays of those.

## Decision tree

| Need | Use |
|---|---|
| Animate to values | `MorePass.to(target, vars)` |
| Start from vars → current | `MorePass.from(target, vars)` |
| Explicit from+to | `MorePass.fromTo(target, from, to)` |
| Instant set | `MorePass.set(target, vars)` |
| Sequence / overlap | `MorePass.timeline()` |
| Multi-step one call | `keyframes: [...]` or `"0%"/ "50%"/ "100%"` |
| Relative end (`+=` `-=` `*=`) | `x: "+=40"` |
| Percent translate | `xPercent` / `yPercent` |
| Pivot | `transformOrigin: "50% 50%"` |
| Find by id | `id: "hero"` → `MorePass.getById("hero")` |
| Pointer / scrub retarget | `MorePass.quickTo(el, "x")` |
| Scoped create + cleanup | `MorePass.context(() => { ... })` then `ctx.revert()` |
| Wait then run | `MorePass.delayedCall(0.4, fn)` |
| Kill by target | `MorePass.killTweensOf(el)` / `isTweening(el)` |
| Read current value | `MorePass.getProperty(el, "x")` |
| Fade + hide | `autoAlpha: 0` (opacity + visibility) |
| Clear inline styles after | `clearProps: "opacity,x"` or `"all"` |
| SVG / HTML attributes | `attr: { r: 40, cx: 100 }` |
| CSS variables | `"--gap": 24` |
| Speed up / slow down | `tw.timeScale(2)` |
| Global defaults | `MorePass.defaults({ ease: "power2.out" })` |
| Scroll-linked | `scrollTrigger: { ... }` on vars |
| Breakpoint contexts | `MorePass.matchMedia({ query: () => ... })` |
| Math helpers | `MorePass.utils.*` (incl. `wrap`, `distribute`) |

## Vars (common)

```ts
{
  // animatable: x, y, scale, scaleX, scaleY, rotation, opacity, autoAlpha,
  // width, height, backgroundColor, color, borderRadius, …
  duration: 0.5,          // seconds (default 0.5)
  delay: 0,
  ease: "power2.out",     // see Eases below
  repeat: 0,              // -1 = infinite
  repeatDelay: 0,
  yoyo: false,
  paused: false,          // drive with progress/seek
  timeScale: 1,
  overwrite: "auto",      // "auto" | true | false
  stagger: { each: 0.08, from: "center" }, // start|end|center|edges|random|index
  keyframes: [/* … */],
  scrollTrigger: { /* … */ },
  attr: { /* svg attrs */ },
  transformOrigin: "50% 0%",
  id: "hero",
  clearProps: "opacity,x", // or "all" / true
  onStart() {},
  onUpdate() {},
  onComplete() {},
  onRepeat() {},
}
```

Controls (every tween/timeline): `play pause reverse restart kill seek progress timeScale isActive` + `duration` / `time`.

## Recipes

### Basic

```ts
MorePass.to(".box", {
  x: 400, y: -20, rotation: 180, scale: 1.1,
  backgroundColor: "#f0c14a",
  duration: 1,
  ease: "power2.out",
})

// relative / percent
MorePass.to(".box", { x: "+=80", xPercent: -50, duration: 0.5 })
MorePass.to(".box", { rotation: 90, transformOrigin: "0% 50%", duration: 0.6 })
MorePass.to(".box", { x: 200, id: "slide" })
MorePass.getById("slide")?.pause()
```

### Timeline positions

```ts
const tl = MorePass.timeline()
tl.to(".a", { x: 200, duration: 0.5 })
tl.to(".b", { opacity: 1, duration: 0.4 }, "-=0.2") // overlap
tl.to(".c", { y: 40, duration: 0.3 }, ">")          // after previous end
tl.to(".d", { x: 0, duration: 0.3 }, "<")           // with previous start
tl.addLabel("spin", 1)
tl.to(".e", { rotation: 360, duration: 0.6 }, "spin")
```

Position tokens: absolute seconds, `"+=0.2"`, `"-=0.2"`, `"<"`, `">"`, `"<0.1"`, `">+=0.2"`, label names.

### Stagger

```ts
MorePass.to(".dot", {
  y: -30, opacity: 1, duration: 0.4, ease: "back.out",
  stagger: { each: 0.08, from: "center" }, // start|end|center|edges|random|index
})
```

Function values: `y: (i, el, all) => i * 10`.

### Keyframes

Array = equal segments using parent `duration` each (unless frame sets its own):

```ts
MorePass.to(el, {
  duration: 0.5, ease: "power2.inOut",
  keyframes: [
    { x: 120 },
    { x: 240, y: -40, scale: 1.2 },
    { x: 360, y: 0, rotation: 180 },
  ],
})
```

Percentage map = share one total `duration`:

```ts
MorePass.to(obj, {
  duration: 2, ease: "none", paused: true,
  keyframes: { "0%": { v: 0 }, "50%": { v: 100 }, "100%": { v: 40 } },
})
```

### Scrub without scroll

```ts
const tw = MorePass.to(el, {
  x: 400, rotation: 180, duration: 1, ease: "none", paused: true,
})
range.oninput = () => tw.progress(Number(range.value) / 1000)
```

### quickTo (pointer follow)

```ts
const setX = MorePass.quickTo(el, "x", { duration: 0.35, ease: "power3.out" })
const setY = MorePass.quickTo(el, "y", { duration: 0.35, ease: "power3.out" })
pad.onpointermove = (e) => { setX(e.offsetX); setY(e.offsetY) }
```

### context / killTweensOf (SPA-safe)

```ts
const ctx = MorePass.context(() => {
  MorePass.to(".a", { x: 100, duration: 0.5 })
  MorePass.to(".b", { opacity: 1, duration: 0.4 })
})
// route leave / unmount:
ctx.revert()

MorePass.killTweensOf(".a")
MorePass.isTweening(".a") // boolean
MorePass.getProperty(".a", "x")
```

### autoAlpha + timeScale

```ts
MorePass.to(".modal", { autoAlpha: 0, duration: 0.3 }) // hides when ~0
const tw = MorePass.to(".box", { x: 400, duration: 1 })
tw.timeScale(2) // twice as fast
```

### defaults

```ts
MorePass.defaults({ ease: "power2.out", duration: 0.6 })
MorePass.defaults({}) // clear
```

### delayedCall / clearProps / attr / CSS vars

```ts
MorePass.delayedCall(0.5, () => console.log("later"))

MorePass.to(".box", {
  x: 200, opacity: 0, duration: 0.4,
  clearProps: "opacity,x",
})

MorePass.to("circle", { attr: { r: 40 }, duration: 0.6 })
MorePass.to(".card", { "--lift": 12, duration: 0.4 })
```

### scrollTrigger

```ts
MorePass.to(".box", {
  x: 400,
  scrollTrigger: {
    trigger: ".section",
    start: "top 80%",
    end: "bottom 20%",
    scrub: true,       // or lag seconds
    pin: true,
    once: true,
    // toggleActions: "play none none none"
    // scroller: overflowElement  // custom scroll container
  },
})
```

Standalone: `MorePass.scrollTrigger({ trigger, animation, ... })`.

### matchMedia

```ts
const mm = MorePass.matchMedia({
  "(min-width: 800px)": () => {
    const tw = MorePass.to(".hero", { x: 100, duration: 1 })
    return () => tw.kill() // cleanup when query no longer matches
  },
  "(max-width: 799px)": () => {
    MorePass.set(".hero", { x: 0 })
  },
})
// later: mm.kill()
```

### utils

```ts
MorePass.utils.clamp(v, 0, 1)
MorePass.utils.mapRange(0, 100, 0, 1, v)
MorePass.utils.interpolate(a, b, t)
MorePass.utils.snap(5, v)           // or snap([0,10,20], v)
MorePass.utils.random(0, 100, 1)    // or random(["a","b"])
MorePass.utils.wrap(0, 360, angle)
MorePass.utils.distribute({ amount: 0.6, from: "center" })
MorePass.utils.pipe(fn1, fn2)
```

## Eases

`none` `linear` · `power1|2|3.in|out|inOut` · `sine.*` · `expo.*` · `circ.*` · `back.*` · `elastic.out` · `bounce.out` · or a custom `(t)=>number`.

Default ease: `power1.out`.

## Transform & color rules

- On elements, `x` `y` `scale` `scaleX` `scaleY` `rotation` share one transform bag (do not fight with raw `transform` CSS).
- Colors: hex / `rgb(a)` / named → `backgroundColor`, `color`, etc.
- Plain objects: any numeric (or color string) own properties.

## Overwrite

- Default `"auto"`: only kills conflicting props on the same target.
- `overwrite: true`: kills the whole prior tween on that target.
- Always `kill()` when tearing down components / routes.

## Do / Don't

**Do**
- Prefer `timeline` for multi-step choreography; `keyframes` for one-target paths.
- Use `paused: true` + `progress` for sliders / scrub UIs (avoid nested page scroll demos unless real scroll is required).
- Return cleanups from `matchMedia` factories.
- Teach motion with this Skill — one file covers the full surface.

**Don't**
- Don't invent a second animation stack beside MorePass in the same feature.
- Don't animate the `transform` string directly; use `x` / `y` / `rotation` / `scale`.
- Don't leave tweens running after unmount — `kill()` or `context().revert()`.
- Don't expect layout-FLIP, text-split, or drag plugins here — stay on the core motion APIs above.

## API map (at a glance)

| Task | Call |
|---|---|
| Tween | `to` `from` `fromTo` `set` |
| Sequence | `timeline` + position tokens |
| Retarget | `quickTo` |
| Scope | `context` → `revert` |
| Delay | `delayedCall` |
| Teardown | `kill` `killTweensOf` `clearProps` |
| Read | `getProperty` `isTweening` |
| Attr / CSS var | `attr:{}` / `"--token"` |
| Scroll | `scrollTrigger` |
| Responsive | `matchMedia` |
| Helpers | `utils` `defaults` `ease` |

## More

- Patterns & edge cases: [examples.md](examples.md)
- Library README: repo root `README.md`
- Live demo: `npm run dev` → http://127.0.0.1:5173/
