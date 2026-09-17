import MorePass, {
  context,
  delayedCall,
  getById,
  matchMedia,
  quickTo,
  type TweenControls,
} from "../src";

const box = document.querySelector<HTMLElement>("#box")!;
const box2 = document.querySelector<HTMLElement>("#box2")!;
const onceBox = document.querySelector<HTMLElement>("#once-box")!;
const scrubBox = document.querySelector<HTMLElement>("#scrub-box")!;
const scrubRange = document.querySelector<HTMLInputElement>("#scrub-range")!;
const scrubVal = document.querySelector<HTMLElement>("#scrub-val")!;
const kfBox = document.querySelector<HTMLElement>("#kf-box")!;
const kfRange = document.querySelector<HTMLInputElement>("#kf-range")!;
const kfVal = document.querySelector<HTMLElement>("#kf-val")!;
const pinTrack = document.querySelector<HTMLElement>("#pin-track")!;
const pinRange = document.querySelector<HTMLInputElement>("#pin-range")!;
const pinVal = document.querySelector<HTMLElement>("#pin-val")!;
const pinLabel = document.querySelector<HTMLElement>("#pin-label")!;
const oncePlay = document.querySelector<HTMLButtonElement>("#once-play")!;
const onceMeta = document.querySelector<HTMLElement>("#once-meta")!;
const mmBox = document.querySelector<HTMLElement>("#mm-box")!;
const utilsFill = document.querySelector<HTMLElement>("#utils-fill")!;
const utilsLabel = document.querySelector<HTMLElement>("#utils-label")!;
const delayBox = document.querySelector<HTMLElement>("#delay-box")!;
const delayMeta = document.querySelector<HTMLElement>("#delay-meta")!;
const cssCard = document.querySelector<HTMLElement>("#css-card")!;
const cssMeta = document.querySelector<HTMLElement>("#css-meta")!;
const attrCircle = document.querySelector<SVGCircleElement>("#attr-circle")!;
const attrMeta = document.querySelector<HTMLElement>("#attr-meta")!;
const quickPad = document.querySelector<HTMLElement>("#quick-pad")!;
const quickDot = document.querySelector<HTMLElement>("#quick-dot")!;
const codeEl = document.querySelector<HTMLElement>("#code")!;
const statusEl = document.querySelector<HTMLElement>("#status")!;
const brand = document.querySelector<HTMLElement>("#brand")!;
const brandGlow = document.querySelector<HTMLElement>("#brand-glow")!;
const stage = document.querySelector<HTMLElement>("#stage")!;
const stageBeam = document.querySelector<HTMLElement>("#stage-beam")!;
const controlsEl = document.querySelector<HTMLElement>("#controls")!;
const aurora = document.querySelector<HTMLElement>("#aurora")!;
const orbA = document.querySelector<HTMLElement>("#orb-a")!;
const orbB = document.querySelector<HTMLElement>("#orb-b")!;
const orbC = document.querySelector<HTMLElement>("#orb-c")!;
const dots = [...document.querySelectorAll<HTMLElement>("#dots .dot")];
const panels = [...document.querySelectorAll<HTMLElement>(".panel")];
const buttons = [
  ...document.querySelectorAll<HTMLButtonElement>("#controls [data-demo]"),
];
const controlButtons = [
  ...document.querySelectorAll<HTMLButtonElement>("#controls button"),
];

let current: TweenControls | null = null;
let mm: ReturnType<typeof matchMedia> | null = null;
let activeDemo = "to";
let onceUsed = false;
let scrubTween: TweenControls | null = null;
let kfTween: TweenControls | null = null;
let setQuickX: ((v: number) => TweenControls) | null = null;
let setQuickY: ((v: number) => TweenControls) | null = null;
let demoCtx: ReturnType<typeof context> | null = null;
let introDone = false;

function status(text: string) {
  statusEl.textContent = text;
}

function show(snippet: string) {
  codeEl.textContent = snippet.trim();
}

function showPanel(id: string) {
  for (const panel of panels) {
    panel.classList.toggle("active", panel.id === id);
  }
  if (!introDone) return;
  MorePass.fromTo(
    stage,
    { opacity: 0.55, y: 8 },
    { opacity: 1, y: 0, duration: 0.32, ease: "power2.out" },
  );
}

function setActiveButton(name: string) {
  for (const btn of buttons) {
    btn.classList.toggle("active", btn.dataset.demo === name);
  }
}

function onQuickMove(e: PointerEvent) {
  const rect = quickPad.getBoundingClientRect();
  const x = Math.max(0, Math.min(rect.width - 28, e.clientX - rect.left - 14));
  const y = Math.max(0, Math.min(rect.height - 28, e.clientY - rect.top - 14));
  setQuickX?.(x);
  setQuickY?.(y);
  status(`quickTo · x ${x.toFixed(0)} y ${y.toFixed(0)}`);
}

function killAll() {
  current?.kill();
  current = null;
  scrubTween?.kill();
  scrubTween = null;
  kfTween?.kill();
  kfTween = null;
  mm?.kill();
  mm = null;
  setQuickX = null;
  setQuickY = null;
  demoCtx?.kill();
  demoCtx = null;
  oncePlay.onclick = null;
  scrubRange.oninput = null;
  kfRange.oninput = null;
  pinRange.oninput = null;
  quickPad.onpointermove = null;
  quickPad.onpointerdown = null;
}

function resetVisuals() {
  box.style.cssText =
    "position:absolute;top:40%;left:40px;width:72px;height:72px;background:linear-gradient(145deg,#2fe39a,#147a4f);";
  box2.style.cssText =
    "position:absolute;top:40%;left:40px;width:72px;height:72px;opacity:0.3;background:linear-gradient(145deg,#ffc857,#9a6d16);";
  MorePass.set(box, { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1, xPercent: 0, yPercent: 0, skewX: 0, skewY: 0 });
  MorePass.set(box2, { x: 0, y: 0, scale: 0.6, rotation: 0, opacity: 0.3, skewX: 0, skewY: 0 });

  onceBox.style.cssText =
    "position:absolute;top:40%;left:40px;width:72px;height:72px;background:linear-gradient(145deg,#2fe39a,#147a4f);";
  MorePass.set(onceBox, { x: 0, scale: 1, rotation: 0, opacity: 1 });
  onceUsed = false;
  onceMeta.textContent = "play once · reset to retry";

  scrubBox.style.cssText =
    "position:absolute;top:38%;left:36px;width:72px;height:72px;background:linear-gradient(145deg,#2fe39a,#147a4f);";
  MorePass.set(scrubBox, {
    x: 0,
    rotation: 0,
    scale: 1,
    backgroundColor: "#2fe39a",
  });
  scrubRange.value = "0";
  scrubVal.textContent = "0.00";

  kfBox.style.cssText =
    "position:absolute;top:38%;left:36px;width:72px;height:72px;background:linear-gradient(145deg,#2fe39a,#147a4f);";
  MorePass.set(kfBox, {
    x: 0,
    y: 0,
    rotation: 0,
    scale: 1,
    backgroundColor: "#2fe39a",
  });
  kfRange.value = "0";
  kfVal.textContent = "0.00";

  pinTrack.style.transform = "translateX(0)";
  pinRange.value = "0";
  pinVal.textContent = "0.00";
  pinLabel.textContent = "background moves · card stays";

  for (const dot of dots) {
    dot.style.cssText = "width:28px;height:28px;background:#2fe39a;opacity:0.25;";
    MorePass.set(dot, { y: 0, scale: 1, opacity: 0.25 });
  }

  MorePass.set(quickDot, { x: 0, y: 0 });
  quickDot.style.left = "20px";
  quickDot.style.top = "60px";

  mmBox.textContent = window.matchMedia("(min-width: 800px)").matches
    ? "≥800px"
    : "<800px";
  MorePass.set(mmBox, { x: 0, scale: 1 });
  utilsFill.style.width = "0%";
  utilsLabel.textContent = "0";

  delayBox.style.cssText =
    "position:absolute;top:40%;left:40px;width:72px;height:72px;background:linear-gradient(145deg,#2fe39a,#147a4f);";
  MorePass.set(delayBox, { x: 0, scale: 1 });
  delayMeta.textContent = "waiting…";

  cssCard.style.setProperty("--lift", "0");
  cssMeta.textContent = "lift 0";

  attrCircle.setAttribute("r", "18");
  attrCircle.setAttribute("fill", "#3ecf8e");
  attrMeta.textContent = "r = 18";
}

function runDemo(name: string) {
  killAll();
  resetVisuals();
  activeDemo = name;
  setActiveButton(name);

  const demos: Record<string, () => void> = {
    to() {
      showPanel("panel-tween");
      show(`MorePass.to(box, {
  x: 420, rotation: 180, scale: 1.15,
  duration: 1, ease: "power2.out"
})`);
      current = MorePass.to(box, {
        x: 420,
        rotation: 180,
        scale: 1.15,
        duration: 1,
        ease: "power2.out",
      });
      status("to()");
    },

    from() {
      showPanel("panel-tween");
      show(`MorePass.from(box, {
  x: 420, opacity: 0, scale: 0.4,
  duration: 0.9, ease: "back.out"
})`);
      current = MorePass.from(box, {
        x: 420,
        opacity: 0,
        scale: 0.4,
        duration: 0.9,
        ease: "back.out",
      });
      status("from()");
    },

    fromTo() {
      showPanel("panel-tween");
      show(`MorePass.fromTo(box2,
  { x: 0, opacity: 0.25, scale: 0.6 },
  { x: 380, opacity: 1, scale: 1, duration: 1 }
)`);
      current = MorePass.fromTo(
        box2,
        { x: 0, opacity: 0.25, scale: 0.6 },
        {
          x: 380,
          opacity: 1,
          scale: 1,
          rotation: 14,
          duration: 1,
          ease: "power3.out",
        },
      );
      status("fromTo()");
    },

    timeline() {
      showPanel("panel-tween");
      show(`MorePass.timeline()
  .to(box, { x: 340, duration: 0.55 })
  .to(box2, { x: 220, opacity: 1, scale: 1 }, "-=0.2")`);
      current = MorePass.timeline()
        .to(box, { x: 340, rotation: 80, duration: 0.55, ease: "power2.out" })
        .to(
          box2,
          { x: 220, opacity: 1, scale: 1, duration: 0.45, ease: "power2.out" },
          "-=0.2",
        );
      status("timeline()");
    },

    stagger() {
      showPanel("panel-stagger");
      show(`MorePass.to(".dot", {
  y: -36, opacity: 1,
  stagger: { each: 0.08, from: "center" }
})`);
      current = MorePass.to(dots, {
        y: -36,
        scale: 1.25,
        opacity: 1,
        duration: 0.4,
        ease: "back.out",
        stagger: { each: 0.08, from: "center" },
      });
      status("stagger");
    },

    color() {
      showPanel("panel-tween");
      show(`MorePass.to(box, { backgroundColor: "#f0c14a", x: 340 })`);
      current = MorePass.to(box, {
        backgroundColor: "#f0c14a",
        x: 340,
        duration: 1,
        ease: "power2.out",
      });
      status("color");
    },

    overwrite() {
      showPanel("panel-tween");
      show(`MorePass.to(box, { x: 440, y: -28, duration: 2 })
MorePass.to(box, { x: 160, duration: 1, delay: 0.3 })`);
      current = MorePass.to(box, { x: 440, y: -28, duration: 2, ease: "none" });
      MorePass.to(box, { x: 160, duration: 1, ease: "power2.out", delay: 0.3 });
      status("overwrite");
    },

    yoyo() {
      showPanel("panel-tween");
      show(`MorePass.to(box, { x: 380, repeat: 3, yoyo: true })`);
      current = MorePass.to(box, {
        x: 380,
        y: -20,
        rotation: 10,
        duration: 0.5,
        ease: "sine.inOut",
        repeat: 3,
        yoyo: true,
      });
      status("yoyo");
    },

    keyframes() {
      showPanel("panel-tween");
      show(`MorePass.to(box, {
  duration: 0.45,
  ease: "power2.inOut",
  keyframes: [
    { x: 180, rotation: 0 },
    { x: 300, y: -36, scale: 1.2 },
    { x: 420, y: 0, rotation: 180, backgroundColor: "#f0c14a" },
  ],
})`);
      current = MorePass.to(box, {
        duration: 0.45,
        ease: "power2.inOut",
        keyframes: [
          { x: 180, rotation: 0 },
          { x: 300, y: -36, scale: 1.2, backgroundColor: "#5ad39a" },
          {
            x: 420,
            y: 0,
            rotation: 180,
            scale: 1,
            backgroundColor: "#f0c14a",
          },
        ],
      });
      status("keyframes · multi-step in one call");
    },

    kfScrub() {
      showPanel("panel-kf");
      show(`const tl = MorePass.to(box, {
  paused: true,
  duration: 0.6,
  ease: "none",
  keyframes: [
    { x: 120 },
    { x: 260, y: -40, backgroundColor: "#5ad39a" },
    { x: 400, y: 0, rotation: 180, backgroundColor: "#f0c14a" },
  ],
})
// slider → tl.progress(t)`);
      kfTween = MorePass.to(kfBox, {
        paused: true,
        duration: 0.6,
        ease: "none",
        keyframes: [
          { x: 120, rotation: 0 },
          { x: 260, y: -40, scale: 1.15, backgroundColor: "#5ad39a" },
          {
            x: 400,
            y: 0,
            rotation: 180,
            scale: 1,
            backgroundColor: "#f0c14a",
          },
        ],
      });
      kfTween.progress(0);
      current = kfTween;

      kfRange.oninput = () => {
        const t = Number(kfRange.value) / 1000;
        kfTween?.progress(t);
        kfVal.textContent = t.toFixed(2);
        status(`kf scrub · progress ${t.toFixed(2)}`);
      };
      status("kf scrub · drag slider through keyframes");
    },

    scrub() {
      showPanel("panel-scrub");
      show(`const tw = MorePass.to(box, {
  x: 400, rotation: 180, backgroundColor: "#f0c14a",
  ease: "none", paused: true,
})
// drag slider → tw.progress(t)`);
      scrubTween = MorePass.to(scrubBox, {
        x: 400,
        rotation: 180,
        backgroundColor: "#f0c14a",
        scale: 1.15,
        duration: 1,
        ease: "none",
        paused: true,
      });
      scrubTween.progress(0);
      current = scrubTween;

      scrubRange.oninput = () => {
        const t = Number(scrubRange.value) / 1000;
        scrubTween?.progress(t);
        scrubVal.textContent = t.toFixed(2);
        status(`scrub · progress ${t.toFixed(2)}`);
      };
      status("scrub · drag the slider");
    },

    pin() {
      showPanel("panel-pin");
      show(`// pin concept without page scroll:
// card stays fixed in panel, world scrolls underneath
track.style.transform = \`translateX(\${-progress * 420}px)\``);
      pinRange.oninput = () => {
        const t = Number(pinRange.value) / 1000;
        pinTrack.style.transform = `translateX(${-t * 460}px)`;
        pinVal.textContent = t.toFixed(2);
        pinLabel.textContent =
          t > 0.08 && t < 0.92
            ? `pinned · ${t.toFixed(2)}`
            : `idle · ${t.toFixed(2)}`;
        status(
          t > 0.08 && t < 0.92
            ? "pin · card fixed · track moves"
            : "pin · idle edges",
        );
      };
      status("pin · drag slider — card stays, world moves");
    },

    once() {
      showPanel("panel-once");
      show(`MorePass.to(box, {
  x: 360, scale: 1.2, duration: 0.75, ease: "back.out",
  // once: ignore repeat triggers until reset
})`);
      oncePlay.onclick = () => {
        if (onceUsed) {
          status("once · already played — hit reset");
          onceMeta.textContent = "already played — press reset";
          return;
        }
        onceUsed = true;
        current?.kill();
        current = MorePass.to(onceBox, {
          x: 360,
          scale: 1.2,
          rotation: 16,
          duration: 0.75,
          ease: "back.out",
        });
        onceMeta.textContent = "played · clicks ignored until reset";
        status("once · played");
      };
      status("once · click play once");
    },

    quickTo() {
      showPanel("panel-quick");
      show(`const setX = MorePass.quickTo(dot, "x", { duration: 0.35 })
const setY = MorePass.quickTo(dot, "y", { duration: 0.35 })
pad.onpointermove = (e) => {
  setX(e.offsetX); setY(e.offsetY)
}`);
      MorePass.set(quickDot, { x: 20, y: 60 });
      setQuickX = quickTo(quickDot, "x", { duration: 0.35, ease: "power3.out" });
      setQuickY = quickTo(quickDot, "y", { duration: 0.35, ease: "power3.out" });
      quickPad.onpointerdown = onQuickMove;
      quickPad.onpointermove = (e) => {
        if (e.buttons || e.pointerType === "touch") onQuickMove(e);
        else onQuickMove(e);
      };
      status("quickTo · move over the pad");
    },

    context() {
      showPanel("panel-tween");
      show(`const ctx = MorePass.context(() => {
  MorePass.to(box, { x: 300, duration: 0.7 })
  MorePass.to(box2, { x: 180, opacity: 1, scale: 1, duration: 0.5 },)
})
// later: ctx.revert()`);
      demoCtx = context(() => {
        current = MorePass.to(box, {
          x: 300,
          rotation: 90,
          duration: 0.7,
          ease: "power2.out",
        });
        MorePass.to(box2, {
          x: 180,
          opacity: 1,
          scale: 1,
          duration: 0.55,
          ease: "power2.out",
        });
      });
      status(`context · ${demoCtx.animations.length} collected · reset reverts`);
    },

    autoAlpha() {
      showPanel("panel-tween");
      show(`MorePass.to(box, { autoAlpha: 0, x: 280, duration: 0.8 })
// opacity → 0 and visibility:hidden`);
      MorePass.set(box, { autoAlpha: 1, x: 0 });
      current = MorePass.to(box, {
        autoAlpha: 0,
        x: 280,
        duration: 0.85,
        ease: "power2.inOut",
      });
      status("autoAlpha · fades then hides");
    },

    delayedCall() {
      showPanel("panel-delay");
      show(`MorePass.delayedCall(0.55, () => {
  MorePass.to(box, { x: 360, scale: 1.15, duration: 0.55 })
})`);
      delayMeta.textContent = "delay 0.55s…";
      status("delayedCall · waiting");
      current = delayedCall(0.55, () => {
        delayMeta.textContent = "fired → tween";
        current = MorePass.to(delayBox, {
          x: 360,
          scale: 1.15,
          duration: 0.55,
          ease: "back.out",
        });
        status("delayedCall · fired");
      });
    },

    clearProps() {
      showPanel("panel-tween");
      show(`MorePass.to(box, {
  x: 320, opacity: 0.35, duration: 0.7,
  clearProps: "opacity,x",
})`);
      current = MorePass.to(box, {
        x: 320,
        opacity: 0.35,
        duration: 0.7,
        ease: "power2.out",
        clearProps: "opacity,x",
        onComplete: () => status("clearProps · inline styles cleared"),
      });
      status("clearProps · animating then clearing");
    },

    cssVar() {
      showPanel("panel-css");
      show(`MorePass.to(card, {
  "--lift": 28, duration: 0.8, ease: "power2.out",
})`);
      cssCard.style.setProperty("--lift", "0");
      current = MorePass.to(cssCard, {
        "--lift": 28,
        duration: 0.85,
        ease: "power2.out",
        onUpdate: () => {
          const v = cssCard.style.getPropertyValue("--lift") || "0";
          cssMeta.textContent = `lift ${Number(v).toFixed(1)}`;
        },
      });
      status("css var · --lift");
    },

    attr() {
      showPanel("panel-attr");
      show(`MorePass.to(circle, {
  attr: { r: 56 },
  duration: 0.9, ease: "power2.out",
})`);
      current = MorePass.to(attrCircle, {
        attr: { r: 56 },
        duration: 0.9,
        ease: "power2.out",
        onUpdate: () => {
          attrMeta.textContent = `r = ${attrCircle.getAttribute("r")}`;
        },
      });
      status("attr · SVG circle r");
    },

    relative() {
      showPanel("panel-tween");
      show(`MorePass.to(box, { x: "+=220", rotation: "+=90", duration: 0.7 })
MorePass.to(box, { x: "-=80", duration: 0.45, delay: 0.15 })`);
      current = MorePass.to(box, {
        x: "+=220",
        rotation: "+=90",
        duration: 0.7,
        ease: "power2.out",
      });
      MorePass.to(box, {
        x: "-=80",
        duration: 0.45,
        ease: "power2.out",
        delay: 0.2,
      });
      status("relative · += / -=");
    },

    percent() {
      showPanel("panel-tween");
      show(`MorePass.to(box, {
  xPercent: 120, yPercent: -40,
  transformOrigin: "0% 50%",
  rotation: 12, duration: 0.8,
})`);
      current = MorePass.to(box, {
        xPercent: 120,
        yPercent: -40,
        transformOrigin: "0% 50%",
        rotation: 12,
        duration: 0.85,
        ease: "power2.out",
      });
      status("percent · xPercent / yPercent + origin");
    },

    getById() {
      showPanel("panel-tween");
      show(`MorePass.to(box, { x: 360, duration: 1.2, id: "hero" })
// later:
MorePass.getById("hero")?.pause()`);
      current = MorePass.to(box, {
        x: 360,
        rotation: 20,
        duration: 1.4,
        ease: "none",
        id: "hero",
      });
      delayedCall(0.55, () => {
        getById("hero")?.pause();
        status("getById('hero') · paused mid-flight");
      });
      status("getById · playing as id hero");
    },

    function() {
      showPanel("panel-tween");
      show(`MorePass.to(box, {
  x: () => 280 + Math.random() * 80,
  duration: 0.8,
})`);
      current = MorePass.to(box, {
        x: () => 280 + Math.random() * 80,
        rotation: () => -8 + Math.random() * 16,
        duration: 0.85,
        ease: "power2.out",
      });
      status("function · end values resolved at build");
    },

    snap() {
      showPanel("panel-tween");
      show(`MorePass.to(box, {
  x: 360, snap: { x: 60 },
  duration: 1.2, ease: "none",
})`);
      current = MorePass.to(box, {
        x: 360,
        snap: { x: 60 },
        duration: 1.2,
        ease: "none",
      });
      status("snap · x steps of 60");
    },

    then() {
      showPanel("panel-tween");
      show(`const tw = MorePass.to(box, { x: 300, duration: 0.7 })
await tw
// also resolves if kill()`);
      status("then · awaiting…");
      current = MorePass.to(box, {
        x: 300,
        scale: 1.08,
        duration: 0.7,
        ease: "power2.out",
      });
      void current.then(() => {
        status("then · resolved on complete");
      });
    },

    invalidate() {
      showPanel("panel-tween");
      show(`const tw = MorePass.to(box, {
  x: () => 200 + Math.random() * 160,
  duration: 1, paused: true,
})
// move box, then:
tw.invalidate().play()`);
      MorePass.set(box, { x: 40 });
      current = MorePass.to(box, {
        x: () => 200 + Math.random() * 160,
        duration: 1,
        ease: "power2.out",
        paused: true,
      });
      delayedCall(0.35, () => {
        MorePass.set(box, { x: 120 });
        current?.invalidate().play();
        status("invalidate · rebuilt from x=120");
      });
      status("invalidate · will rebuild mid-flight");
      current.play();
    },

    skew() {
      showPanel("panel-tween");
      show(`MorePass.to(box, {
  skewX: 18, skewY: -8,
  duration: 0.8, ease: "power2.out",
})`);
      current = MorePass.to(box, {
        skewX: 18,
        skewY: -8,
        x: 220,
        duration: 0.85,
        ease: "power2.out",
      });
      status("skew · skewX / skewY");
    },

    matchMedia() {
      showPanel("panel-mm");
      show(`MorePass.matchMedia({
  "(min-width: 800px)": () => {
    const tw = MorePass.to(box, { x: 140, scale: 1.12 })
    return () => tw.kill()
  },
  "(max-width: 799px)": () => MorePass.set(box, { x: 0, scale: 0.85 }),
})`);
      mm = matchMedia({
        "(min-width: 800px)": () => {
          mmBox.textContent = "≥800px";
          status("matchMedia · wide");
          const tw = MorePass.to(mmBox, {
            x: 140,
            scale: 1.12,
            duration: 0.45,
            ease: "power2.out",
          });
          return () => tw.kill();
        },
        "(max-width: 799px)": () => {
          mmBox.textContent = "<800px";
          status("matchMedia · narrow");
          MorePass.set(mmBox, { x: 0, scale: 0.85 });
        },
      });
    },

    utils() {
      showPanel("panel-utils");
      show(`const dist = MorePass.utils.distribute({ amount: 100, from: "start" })
MorePass.to(t, {
  p: 100, duration: 1.1,
  onUpdate: () => {
    const w = MorePass.utils.mapRange(0, 100, 0, 100, t.p)
    fill.style.width = w + "%"
  }
})`);
      const t = { p: 0 };
      const dist = MorePass.utils.distribute({ amount: 100, from: "start" });
      current = MorePass.to(t, {
        p: 100,
        duration: 1.1,
        ease: "power2.inOut",
        onUpdate: () => {
          const w = MorePass.utils.mapRange(0, 100, 0, 100, t.p);
          const snapped = MorePass.utils.snap(5, w);
          const wrapped = MorePass.utils.wrap(0, 100, w + 10);
          utilsFill.style.width = `${w}%`;
          utilsLabel.textContent = String(snapped);
          status(
            `utils · ${w.toFixed(0)} · snap ${snapped} · wrap ${wrapped.toFixed(0)} · dist0 ${dist(0, null, [0, 1, 2]).toFixed(0)}`,
          );
        },
      });
    },
  };

  demos[name]?.();
}

for (const btn of buttons) {
  btn.addEventListener("click", () => {
    const name = btn.dataset.demo;
    if (name) runDemo(name);
  });
}

document.querySelector("#pause")!.addEventListener("click", () => {
  if (!current) {
    status("nothing to pause");
    return;
  }
  if (current.isActive()) {
    current.pause();
    status("paused");
  } else {
    current.play();
    status("playing");
  }
});

document.querySelector("#reset")!.addEventListener("click", () => {
  runDemo(activeDemo);
});

function bootAtmosphere() {
  MorePass.set(aurora, { x: -80, opacity: 0.4 });
  MorePass.to(aurora, {
    x: 180,
    opacity: 0.7,
    duration: 9,
    ease: "sine.inOut",
    yoyo: true,
    repeat: -1,
  });

  MorePass.set(stageBeam, { x: -40, opacity: 0.2 });
  MorePass.to(stageBeam, {
    x: 420,
    opacity: 0.55,
    duration: 4.8,
    ease: "sine.inOut",
    yoyo: true,
    repeat: -1,
  });

  MorePass.to(brandGlow, {
    scale: 1.18,
    opacity: 0.75,
    duration: 3.2,
    ease: "sine.inOut",
    yoyo: true,
    repeat: -1,
  });

  MorePass.to(orbA, {
    y: 40,
    x: 30,
    scale: 1.12,
    duration: 6,
    ease: "sine.inOut",
    yoyo: true,
    repeat: -1,
  });
  MorePass.to(orbB, {
    y: -50,
    x: -24,
    scale: 1.08,
    duration: 7.5,
    ease: "sine.inOut",
    yoyo: true,
    repeat: -1,
  });
  MorePass.to(orbC, {
    y: 28,
    x: -36,
    scale: 1.15,
    duration: 5.5,
    ease: "sine.inOut",
    yoyo: true,
    repeat: -1,
  });
}

function bootIntro() {
  MorePass.set(brand, { y: 42, opacity: 0, scale: 0.94 });
  MorePass.set(controlsEl, { y: 22, opacity: 0 });
  MorePass.set(stage, { y: 28, opacity: 0 });
  MorePass.set(codeEl, { y: 18, opacity: 0 });
  MorePass.set(statusEl, { opacity: 0 });
  MorePass.set(controlButtons, { opacity: 0, y: 10 });

  MorePass.timeline()
    .to(brand, {
      y: 0,
      opacity: 1,
      scale: 1,
      duration: 0.85,
      ease: "power3.out",
    })
    .to(
      controlButtons,
      {
        opacity: 1,
        y: 0,
        duration: 0.45,
        ease: "power2.out",
        stagger: 0.018,
      },
      "-=0.35",
    )
    .to(
      controlsEl,
      { y: 0, opacity: 1, duration: 0.2, ease: "power1.out" },
      "<",
    )
    .to(
      stage,
      { y: 0, opacity: 1, duration: 0.65, ease: "power2.out" },
      "-=0.35",
    )
    .to(
      [codeEl, statusEl],
      { y: 0, opacity: 1, duration: 0.45, ease: "power2.out" },
      "-=0.28",
    )
    .call(() => {
      MorePass.set(brand, { opacity: 1, y: 0, scale: 1 });
      MorePass.set(controlsEl, { opacity: 1, y: 0 });
      MorePass.set(controlButtons, { opacity: 1, y: 0 });
      MorePass.set(stage, { opacity: 1, y: 0 });
      introDone = true;
      runDemo("to");
    });
}

bootAtmosphere();
bootIntro();
