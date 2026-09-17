import { resolveTargets } from "./tween";
import type { Target, TweenControls } from "./types";
import type { ScrollTriggerInstance, ScrollTriggerVars } from "./scroll-types";

export type { ScrollTriggerInstance, ScrollTriggerVars };

type Action =
  | "play"
  | "pause"
  | "resume"
  | "reset"
  | "restart"
  | "complete"
  | "reverse"
  | "none";

const instances = new Set<ScrollTrigger>();
let listening = false;
let ticking = false;

function ensureListeners() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
}

function teardownListeners() {
  if (!listening || instances.size > 0) return;
  listening = false;
  window.removeEventListener("scroll", onScroll);
  window.removeEventListener("resize", onResize);
}

function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    ticking = false;
    for (const inst of instances) inst.update();
  });
}

function onResize() {
  for (const inst of instances) inst.refresh();
  onScroll();
}

function resolveElement(target: Target | Element | undefined): Element | null {
  if (!target) return null;
  if (typeof Element !== "undefined" && target instanceof Element) return target;
  if (typeof target === "string") {
    return document.querySelector(target);
  }
  const list = resolveTargets(target as Target);
  const first = list[0];
  return first instanceof Element ? first : null;
}

function parsePart(part: string): { kind: "top" | "center" | "bottom" | "pct"; pct?: number } {
  const p = part.trim().toLowerCase();
  if (p === "top") return { kind: "top" };
  if (p === "center" || p === "centre" || p === "middle") return { kind: "center" };
  if (p === "bottom") return { kind: "bottom" };
  if (p.endsWith("%")) {
    return { kind: "pct", pct: parseFloat(p) / 100 };
  }
  const n = parseFloat(p);
  if (!Number.isNaN(n)) return { kind: "pct", pct: n > 1 ? n / 100 : n };
  return { kind: "top" };
}

function parseStartEnd(value: string | undefined, fallback: string) {
  const raw = (value ?? fallback).trim();
  const parts = raw.split(/\s+/);
  const triggerPart = parts[0] ?? "top";
  const scrollerPart = parts[1] ?? "bottom";
  return {
    trigger: parsePart(triggerPart),
    scroller: parsePart(scrollerPart),
  };
}

function triggerPoint(
  rect: { top: number; height: number },
  scrollY: number,
  part: ReturnType<typeof parsePart>,
): number {
  const absTop = rect.top + scrollY;
  if (part.kind === "top") return absTop;
  if (part.kind === "center") return absTop + rect.height / 2;
  if (part.kind === "bottom") return absTop + rect.height;
  return absTop + rect.height * (part.pct ?? 0);
}

function scrollerOffset(part: ReturnType<typeof parsePart>): number {
  const vh = typeof window !== "undefined" ? window.innerHeight : 0;
  if (part.kind === "top") return 0;
  if (part.kind === "center") return vh / 2;
  if (part.kind === "bottom") return vh;
  return vh * (part.pct ?? 0);
}

function clamp01(n: number) {
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

function applyAction(animation: TweenControls | undefined, action: Action) {
  if (!animation || action === "none") return;
  switch (action) {
    case "play":
    case "resume":
      animation.play();
      break;
    case "pause":
      animation.pause();
      break;
    case "reset":
      animation.pause();
      animation.progress(0);
      break;
    case "restart":
      animation.restart();
      break;
    case "complete":
      animation.progress(1);
      animation.pause();
      break;
    case "reverse":
      animation.reverse();
      break;
  }
}

function parseToggleActions(raw?: string): [Action, Action, Action, Action] {
  const parts = (raw ?? "play none none none").trim().split(/\s+/);
  const asAction = (s: string | undefined): Action => {
    const v = (s ?? "none") as Action;
    const ok: Action[] = [
      "play",
      "pause",
      "resume",
      "reset",
      "restart",
      "complete",
      "reverse",
      "none",
    ];
    return ok.includes(v) ? v : "none";
  };
  return [
    asAction(parts[0]),
    asAction(parts[1]),
    asAction(parts[2]),
    asAction(parts[3]),
  ];
}

class ScrollTrigger implements ScrollTriggerInstance {
  private triggerEl: Element | null = null;
  private startScroll = 0;
  private endScroll = 1;
  private _progress = 0;
  private _direction: 1 | -1 = 1;
  private _isActive = false;
  private prevProgress = -1;
  private killed = false;
  private enteredOnce = false;
  private scrubSmooth = 0;
  private scrubTarget = 0;
  private scrubRaf = 0;
  private markers: HTMLElement[] = [];
  private readonly actions: [Action, Action, Action, Action];
  private readonly vars: ScrollTriggerVars;
  private readonly animation?: TweenControls;

  constructor(vars: ScrollTriggerVars) {
    this.vars = vars;
    this.animation = vars.animation;
    this.actions = parseToggleActions(vars.toggleActions);
    this.scrubSmooth = typeof vars.scrub === "number" ? vars.scrub : 0;

    if (vars.scrub) {
      this.animation?.pause();
      this.animation?.progress(0);
    } else {
      // wait for trigger unless already past start
      this.animation?.pause();
    }

    this.triggerEl = resolveElement(vars.trigger);
    this.refresh();
    instances.add(this);
    ensureListeners();
    this.update();
  }

  get progress() {
    return this._progress;
  }

  get direction() {
    return this._direction;
  }

  get isActive() {
    return this._isActive;
  }

  get start() {
    return this.startScroll;
  }

  get end() {
    return this.endScroll;
  }

  refresh() {
    if (this.killed || typeof window === "undefined") return;
    const el = this.triggerEl;
    if (!el) {
      this.startScroll = 0;
      this.endScroll = window.innerHeight;
      return;
    }

    const scrollY = window.scrollY || window.pageYOffset || 0;
    const rect = el.getBoundingClientRect();
    const startParts = parseStartEnd(this.vars.start, "top bottom");
    const endParts = parseStartEnd(this.vars.end, "bottom top");

    this.startScroll =
      triggerPoint(rect, scrollY, startParts.trigger) -
      scrollerOffset(startParts.scroller);
    this.endScroll =
      triggerPoint(rect, scrollY, endParts.trigger) -
      scrollerOffset(endParts.scroller);

    if (this.endScroll <= this.startScroll) {
      this.endScroll = this.startScroll + 1;
    }

    this.renderMarkers();
  }

  update() {
    if (this.killed || typeof window === "undefined") return;
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const raw = (scrollY - this.startScroll) / (this.endScroll - this.startScroll);
    const next = clamp01(raw);
    const prev = this.prevProgress;

    if (next > this._progress) this._direction = 1;
    else if (next < this._progress) this._direction = -1;

    const wasActive = this._isActive;
    this._isActive = next > 0 && next < 1;
    this._progress = next;

    // Callbacks / toggleActions based on crossing thresholds
    if (prev < 0) {
      // first paint
      if (next > 0 && next < 1) {
        this.fireEnter(false);
      } else if (next >= 1) {
        this.fireEnter(false);
        this.fireLeave(false);
      }
    } else {
      if (prev <= 0 && next > 0) this.fireEnter(false);
      if (prev < 1 && next >= 1) this.fireLeave(false);
      if (prev >= 1 && next < 1) this.fireEnter(true);
      if (prev > 0 && next <= 0) this.fireLeave(true);
    }

    if (wasActive !== this._isActive) {
      this.vars.onToggle?.(this);
    }

    if (this.vars.scrub) {
      this.scrubTarget = next;
      if (this.scrubSmooth > 0) this.ensureScrubLoop();
      else this.animation?.progress(next);
    }

    this.vars.onUpdate?.(this);
    this.prevProgress = next;

    if (this.vars.once && this.enteredOnce && next >= 1) {
      // keep completed state; optionally kill listeners for this instance later
    }
  }

  kill() {
    if (this.killed) return;
    this.killed = true;
    instances.delete(this);
    if (this.scrubRaf) cancelAnimationFrame(this.scrubRaf);
    for (const m of this.markers) m.remove();
    this.markers = [];
    teardownListeners();
  }

  private fireEnter(back: boolean) {
    if (this.vars.once && this.enteredOnce && !back) return;
    if (!back) this.enteredOnce = true;
    if (this.vars.scrub) return;
    if (back) {
      applyAction(this.animation, this.actions[2]);
      this.vars.onEnterBack?.(this);
    } else {
      applyAction(this.animation, this.actions[0]);
      this.vars.onEnter?.(this);
    }
  }

  private fireLeave(back: boolean) {
    if (this.vars.scrub) return;
    if (back) {
      applyAction(this.animation, this.actions[3]);
      this.vars.onLeaveBack?.(this);
    } else {
      applyAction(this.animation, this.actions[1]);
      this.vars.onLeave?.(this);
    }
  }

  private ensureScrubLoop() {
    if (this.scrubRaf) return;
    const step = () => {
      this.scrubRaf = 0;
      if (this.killed || !this.animation) return;
      const current = this.animation.progress() as number;
      const lag = Math.max(this.scrubSmooth, 0.016);
      const t = 1 - Math.exp(-1 / (lag * 60));
      const next = current + (this.scrubTarget - current) * t;
      this.animation.progress(next);
      if (Math.abs(this.scrubTarget - next) > 0.0005) {
        this.scrubRaf = requestAnimationFrame(step);
      }
    };
    this.scrubRaf = requestAnimationFrame(step);
  }

  private renderMarkers() {
    for (const m of this.markers) m.remove();
    this.markers = [];
    if (!this.vars.markers || typeof document === "undefined") return;

    const mk = (label: string, y: number, color: string) => {
      const el = document.createElement("div");
      el.textContent = label;
      el.style.cssText = [
        "position:absolute",
        "left:0",
        `top:${Math.max(0, y)}px`,
        "z-index:99999",
        "padding:2px 6px",
        "font:12px/1.2 monospace",
        `background:${color}`,
        "color:#111",
        "pointer-events:none",
      ].join(";");
      document.body.appendChild(el);
      this.markers.push(el);
    };

    mk("start", this.startScroll, "#3ecf8e");
    mk("end", this.endScroll, "#f0c14a");
  }
}

export function createScrollTrigger(
  vars: ScrollTriggerVars,
): ScrollTriggerInstance {
  return new ScrollTrigger(vars);
}

export const scrollTrigger = {
  create: createScrollTrigger,
  getAll(): ScrollTriggerInstance[] {
    return [...instances];
  },
  refresh() {
    for (const inst of instances) inst.refresh();
  },
  killAll() {
    for (const inst of [...instances]) inst.kill();
  },
};

/** Test helper */
export function _scrollTriggerReset() {
  scrollTrigger.killAll();
}
