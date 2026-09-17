import MorePass, { scrollTrigger, type TweenControls } from "../src";

const stage = document.querySelector<HTMLElement>("#stage")!;
const box = document.querySelector<HTMLElement>("#box")!;
const box2 = document.querySelector<HTMLElement>("#box2")!;
const scrollBox = document.querySelector<HTMLElement>("#scroll-box")!;
const scrollSection = document.querySelector<HTMLElement>("#scroll-section")!;
const dots = [...document.querySelectorAll<HTMLElement>("#dots .dot")];
const code = document.querySelector<HTMLElement>("#code")!;

let current: TweenControls | null = null;
let scrollReady = false;

function resetBoxes() {
  current?.kill();
  scrollTrigger.killAll();
  scrollReady = false;
  stage.classList.remove("show-dots");
  box.style.cssText =
    "position:absolute;top:100px;left:40px;width:72px;height:72px;background:linear-gradient(145deg, #3ecf8e, #1f8f5f);";
  box2.style.cssText =
    "position:absolute;top:100px;left:40px;width:72px;height:72px;opacity:0.2;background:linear-gradient(145deg, #f0c14a, #b8891f);";
  MorePass.set(box, { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 });
  MorePass.set(box2, { x: 0, y: 0, scale: 0.6, rotation: 0, opacity: 0.2 });
  MorePass.set(scrollBox, { x: 0, rotation: 0, backgroundColor: "#3ecf8e" });
  for (const dot of dots) {
    dot.style.cssText =
      "width:28px;height:28px;background:#3ecf8e;opacity:0.25;";
    MorePass.set(dot, { y: 0, scale: 1, opacity: 0.25 });
  }
}

function show(snippet: string) {
  code.textContent = snippet.trim();
}

function armScrollDemo() {
  if (scrollReady) {
    scrollTrigger.refresh();
    return;
  }
  scrollReady = true;
  current = MorePass.to(scrollBox, {
    x: 520,
    rotation: 180,
    backgroundColor: "#f0c14a",
    ease: "none",
    scrollTrigger: {
      trigger: scrollSection,
      start: "top 80%",
      end: "bottom 20%",
      scrub: true,
    },
  });
}

document.querySelector("#to")!.addEventListener("click", () => {
  resetBoxes();
  show(`MorePass.to(box, {
  x: 520, rotation: 180, scale: 1.2,
  duration: 1, ease: "power2.out"
})`);
  current = MorePass.to(box, {
    x: 520,
    rotation: 180,
    scale: 1.2,
    duration: 1,
    ease: "power2.out",
  });
});

document.querySelector("#from")!.addEventListener("click", () => {
  resetBoxes();
  show(`MorePass.from(box, {
  x: 520, opacity: 0, scale: 0.4,
  duration: 0.9, ease: "back.out"
})`);
  current = MorePass.from(box, {
    x: 520,
    opacity: 0,
    scale: 0.4,
    duration: 0.9,
    ease: "back.out",
  });
});

document.querySelector("#fromTo")!.addEventListener("click", () => {
  resetBoxes();
  show(`MorePass.fromTo(box2,
  { x: 0, opacity: 0.2, scale: 0.6 },
  { x: 480, opacity: 1, scale: 1, rotation: 20,
    duration: 1.1, ease: "power3.out" }
)`);
  current = MorePass.fromTo(
    box2,
    { x: 0, opacity: 0.2, scale: 0.6 },
    {
      x: 480,
      opacity: 1,
      scale: 1,
      rotation: 20,
      duration: 1.1,
      ease: "power3.out",
    },
  );
});

document.querySelector("#timeline")!.addEventListener("click", () => {
  resetBoxes();
  show(`MorePass.timeline()
  .to(box, { x: 420, rotation: 90, duration: 0.7, ease: "power2.out" })
  .to(box2, { x: 280, opacity: 1, scale: 1, duration: 0.6 }, "-=0.35")
  .to(box, { y: -40, scale: 1.15, duration: 0.4 }, "<0.1")
  .to([box, box2], { rotation: 0, y: 0, scale: 1, duration: 0.5 })`);
  current = MorePass.timeline()
    .to(box, { x: 420, rotation: 90, duration: 0.7, ease: "power2.out" })
    .to(
      box2,
      { x: 280, opacity: 1, scale: 1, duration: 0.6, ease: "power2.out" },
      "-=0.35",
    )
    .to(box, { y: -40, scale: 1.15, duration: 0.4, ease: "sine.inOut" }, "<0.1")
    .to([box, box2], {
      rotation: 0,
      y: 0,
      scale: 1,
      duration: 0.5,
      ease: "power2.inOut",
    });
});

document.querySelector("#stagger")!.addEventListener("click", () => {
  resetBoxes();
  stage.classList.add("show-dots");
  show(`MorePass.to(".dot", {
  y: -48, scale: 1.35, opacity: 1,
  duration: 0.45, ease: "back.out",
  stagger: { each: 0.08, from: "center" }
})`);
  current = MorePass.to(dots, {
    y: -48,
    scale: 1.35,
    opacity: 1,
    duration: 0.45,
    ease: "back.out",
    stagger: { each: 0.08, from: "center" },
  });
});

document.querySelector("#scroll")!.addEventListener("click", () => {
  resetBoxes();
  show(`MorePass.to(scrollBox, {
  x: 520, rotation: 180, backgroundColor: "#f0c14a",
  ease: "none",
  scrollTrigger: {
    trigger: "#scroll-section",
    start: "top 80%",
    end: "bottom 20%",
    scrub: true,
  },
})`);
  armScrollDemo();
  scrollSection.scrollIntoView({ behavior: "smooth", block: "center" });
});

document.querySelector("#color")!.addEventListener("click", () => {
  resetBoxes();
  show(`MorePass.to(box, {
  backgroundColor: "#f0c14a",
  x: 360, duration: 1, ease: "power2.out"
})`);
  current = MorePass.to(box, {
    backgroundColor: "#f0c14a",
    x: 360,
    duration: 1,
    ease: "power2.out",
  });
});

document.querySelector("#overwrite")!.addEventListener("click", () => {
  resetBoxes();
  show(`// second tween steals x; y keeps going
MorePass.to(box, { x: 500, y: -50, duration: 2, ease: "none" })
MorePass.to(box, { x: 200, duration: 1, ease: "power2.out", delay: 0.4 })`);
  current = MorePass.to(box, {
    x: 500,
    y: -50,
    duration: 2,
    ease: "none",
  });
  MorePass.to(box, {
    x: 200,
    duration: 1,
    ease: "power2.out",
    delay: 0.4,
  });
});

document.querySelector("#yoyo")!.addEventListener("click", () => {
  resetBoxes();
  show(`MorePass.to(box, {
  x: 500, y: -30, rotation: 12,
  duration: 0.6, ease: "sine.inOut",
  repeat: 3, yoyo: true
})`);
  current = MorePass.to(box, {
    x: 500,
    y: -30,
    rotation: 12,
    duration: 0.6,
    ease: "sine.inOut",
    repeat: 3,
    yoyo: true,
  });
});

document.querySelector("#pause")!.addEventListener("click", () => {
  if (!current) return;
  if (current.isActive()) current.pause();
  else current.play();
});

document.querySelector("#reset")!.addEventListener("click", () => {
  resetBoxes();
  show("// reset");
});

resetBoxes();
armScrollDemo();
show(`import MorePass from "morepass"

MorePass.to(".box", {
  x: 520,
  scrollTrigger: { start: "top 80%", scrub: true },
})`);
