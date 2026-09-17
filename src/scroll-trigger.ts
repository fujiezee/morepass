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

type ScrollRoot = Window | Element;

const instances = new Set<ScrollTrigger>();
const scrollerRefs = new Map<ScrollRoot, { count: number; onScroll: () => void }>();
let resizeBound = false;
let ticking = false;

function isWindowScroller(value: ScrollRoot): value is Window {
  return value === window;
}

function resolveScroller(
  value: ScrollTriggerVars["scroller"] | undefined,
): ScrollRoot {
  if (!value || value === window) return window;
  if (typeof Element !== "undefined" && value instanceof Element) return value;
  if (typeof value === "string") {
    return document.querySelector(value) ?? window;
  }
  const el = resolveElement(value as Target);
  return el ?? window;
}

function ensureResize() {
  if (resizeBound || typeof window === "undefined") return;
  resizeBound = true;
  window.addEventListener("resize", onResize, { passive: true });
}

function onResize() {
  for (const inst of instances) inst.refresh();
  queueAll();
}

function queueAll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    ticking = false;
    for (const inst of instances) inst.update();
  });
}

function bindScroller(scroller: ScrollRoot) {
  const existing = scrollerRefs.get(scroller);
  if (existing) {
    existing.count += 1;
    return;
  }
  const onScroll = () => queueAll();
  scrollerRefs.set(scroller, { count: 1, onScroll });
  scroller.addEventListener("scroll", onScroll, { passive: true });
  ensureResize();
}

function unbindScroller(scroller: ScrollRoot) {
  const existing = scrollerRefs.get(scroller);
  if (!existing) return;
  existing.count -= 1;
  if (existing.count > 0) return;
  scroller.removeEventListener("scroll", existing.onScroll);
  scrollerRefs.delete(scroller);
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

function parsePart(part: string): {
  kind: "top" | "center" | "bottom" | "pct";
  pct?: number;
} {
  const p = part.trim().toLowerCase();
  if (p === "top") return { kind: "top" };
  if (p === "center" || p === "centre" || p === "middle") return { kind: "center" };
  if (p === "bottom") return { kind: "bottom" };
  if (p.endsWith("%")) return { kind: "pct", pct: parseFloat(p) / 100 };
  const n = parseFloat(p);
  if (!Number.isNaN(n)) return { kind: "pct", pct: n > 1 ? n / 100 : n };
  return { kind: "top" };
}

function parseStartEnd(value: string | undefined, fallback: string) {
  const raw = (value ?? fallback).trim();
  const parts = raw.split(/\s+/);
  return {
    trigger: parsePart(parts[0] ?? "top"),
    view: parsePart(parts[1] ?? "bottom"),
  };
}

function getScrollTop(scroller: ScrollRoot): number {
  if (isWindowScroller(scroller)) {
    return window.scrollY || window.pageYOffset || 0;
  }
  return scroller.scrollTop;
}

function getViewSize(scroller: ScrollRoot): number {
  if (isWindowScroller(scroller)) return window.innerHeight;
  return scroller.clientHeight;
}

function getTriggerMetrics(
  trigger: Element,
  scroller: ScrollRoot,
): { top: number; height: number } {
  const scrollTop = getScrollTop(scroller);
  if (isWindowScroller(scroller)) {
    const rect = trigger.getBoundingClientRect();
    return { top: rect.top + scrollTop, height: rect.height };
  }
  const sRect = scroller.getBoundingClientRect();
  const tRect = trigger.getBoundingClientRect();
  return {
    top: tRect.top - sRect.top + scrollTop,
    height: tRect.height,
  };
}

function pointOnTrigger(
  metrics: { top: number; height: number },
  part: ReturnType<typeof parsePart>,
): number {
  if (part.kind === "top") return metrics.top;
  if (part.kind === "center") return metrics.top + metrics.height / 2;
  if (part.kind === "bottom") return metrics.top + metrics.height;
  return metrics.top + metrics.height * (part.pct ?? 0);
}

function viewOffset(
  scroller: ScrollRoot,
  part: ReturnType<typeof parsePart>,
): number {
  const size = getViewSize(scroller);
  if (part.kind === "top") return 0;
  if (part.kind === "center") return size / 2;
  if (part.kind === "bottom") return size;
  return size * (part.pct ?? 0);
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

interface PinState {
  el: HTMLElement;
  spacer: HTMLElement | null;
  saved: {
    position: string;
    top: string;
    left: string;
    width: string;
    zIndex: string;
    margin: string;
  };
  pinTop: number;
  pinLeft: number;
  width: number;
  height: number;
  active: boolean;
}

class ScrollTrigger implements ScrollTriggerInstance {
  private triggerEl: Element | null = null;
  private scroller: ScrollRoot = window;
  private startScroll = 0;
  private endScroll = 1;
  private _progress = 0;
  private _direction: 1 | -1 = 1;
  private _isActive = false;
  private prevProgress = -1;
  private killed = false;
  private enteredOnce = false;
  private completedOnce = false;
  private scrubSmooth = 0;
  private scrubTarget = 0;
  private scrubRaf = 0;
  private markers: HTMLElement[] = [];
  private pin: PinState | null = null;
  private readonly actions: [Action, Action, Action, Action];
  private readonly vars: ScrollTriggerVars;
  private readonly animation?: TweenControls;

  constructor(vars: ScrollTriggerVars) {
    this.vars = vars;
    this.animation = vars.animation;
    this.actions = parseToggleActions(vars.toggleActions);
    this.scrubSmooth = typeof vars.scrub === "number" ? vars.scrub : 0;
    this.scroller = resolveScroller(vars.scroller);

    this.animation?.pause();
    if (vars.scrub) this.animation?.progress(0);

    this.triggerEl = resolveElement(vars.trigger);
    this.setupPin();
    this.refresh();
    instances.add(this);
    bindScroller(this.scroller);
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
    const wasPinned = this.pin?.active;
    if (wasPinned) this.applyPin(false, "before");

    const el = this.triggerEl;
    if (!el) {
      this.startScroll = 0;
      this.endScroll = getViewSize(this.scroller);
      return;
    }

    const metrics = getTriggerMetrics(el, this.scroller);
    const startParts = parseStartEnd(this.vars.start, "top bottom");
    const endParts = parseStartEnd(this.vars.end, "bottom top");

    this.startScroll =
      pointOnTrigger(metrics, startParts.trigger) -
      viewOffset(this.scroller, startParts.view);
    this.endScroll =
      pointOnTrigger(metrics, endParts.trigger) -
      viewOffset(this.scroller, endParts.view);

    if (this.endScroll <= this.startScroll) {
      this.endScroll = this.startScroll + 1;
    }

    if (this.pin) {
      const m = getTriggerMetrics(this.pin.el, this.scroller);
      this.pin.height = m.height;
      if (this.pin.spacer && this.vars.pinSpacing !== false) {
        const distance = this.endScroll - this.startScroll;
        this.pin.spacer.style.height = `${this.pin.height + distance}px`;
      }
    }

    this.renderMarkers();
    if (wasPinned) this.update();
  }

  update() {
    if (this.killed || typeof window === "undefined") return;

    if (this.completedOnce && this.vars.once) {
      if (this.vars.scrub) this.animation?.progress(1);
      return;
    }

    const scrollTop = getScrollTop(this.scroller);
    const raw =
      (scrollTop - this.startScroll) / (this.endScroll - this.startScroll);
    const next = clamp01(raw);
    const prev = this.prevProgress;

    if (next > this._progress) this._direction = 1;
    else if (next < this._progress) this._direction = -1;

    const wasActive = this._isActive;
    this._isActive = next > 0 && next < 1;
    this._progress = next;

    if (prev < 0) {
      if (next > 0 && next < 1) this.fireEnter(false);
      else if (next >= 1) {
        this.fireEnter(false);
        this.fireLeave(false);
      }
    } else {
      if (prev <= 0 && next > 0) this.fireEnter(false);
      if (prev < 1 && next >= 1) this.fireLeave(false);
      if (prev >= 1 && next < 1) this.fireEnter(true);
      if (prev > 0 && next <= 0) this.fireLeave(true);
    }

    if (wasActive !== this._isActive) this.vars.onToggle?.(this);

    if (this.pin) {
      if (next <= 0) this.applyPin(false, "before");
      else if (next >= 1) this.applyPin(false, "after");
      else this.applyPin(true);
    }

    if (this.vars.scrub) {
      this.scrubTarget = next;
      if (this.scrubSmooth > 0) this.ensureScrubLoop();
      else this.animation?.progress(next);
    }

    this.vars.onUpdate?.(this);
    this.prevProgress = next;
    if (this.vars.once && next >= 1) this.completedOnce = true;
  }

  kill() {
    if (this.killed) return;
    this.killed = true;
    instances.delete(this);
    unbindScroller(this.scroller);
    if (this.scrubRaf) cancelAnimationFrame(this.scrubRaf);
    this.teardownPin();
    for (const m of this.markers) m.remove();
    this.markers = [];
  }

  private setupPin() {
    if (!this.vars.pin || typeof document === "undefined") return;
    const pinTarget =
      this.vars.pin === true
        ? this.triggerEl
        : resolveElement(this.vars.pin as Target | Element);
    if (!(pinTarget instanceof HTMLElement)) return;

    const spacer =
      this.vars.pinSpacing === false ? null : document.createElement("div");
    if (spacer) {
      spacer.className = "morepass-pin-spacer";
      spacer.style.cssText =
        "display:block;position:relative;width:100%;pointer-events:none;";
      pinTarget.parentNode?.insertBefore(spacer, pinTarget);
    }

    this.pin = {
      el: pinTarget,
      spacer,
      saved: {
        position: pinTarget.style.position,
        top: pinTarget.style.top,
        left: pinTarget.style.left,
        width: pinTarget.style.width,
        zIndex: pinTarget.style.zIndex,
        margin: pinTarget.style.margin,
      },
      pinTop: 0,
      pinLeft: 0,
      width: 0,
      height: 0,
      active: false,
    };
  }

  private applyPin(active: boolean, rest: "before" | "after" = "before") {
    const pin = this.pin;
    if (!pin) return;

    if (active) {
      if (pin.active) {
        // Keep fixed element aligned to scroller viewport while scrolling
        if (!isWindowScroller(this.scroller)) {
          const host = this.scroller.getBoundingClientRect();
          pin.el.style.top = `${host.top + pin.pinTop}px`;
          pin.el.style.left = `${host.left + pin.pinLeft}px`;
        }
        return;
      }
      const host = isWindowScroller(this.scroller)
        ? { top: 0, left: 0 }
        : this.scroller.getBoundingClientRect();
      const rect = pin.el.getBoundingClientRect();
      pin.pinTop = rect.top - host.top;
      pin.pinLeft = rect.left - host.left;
      pin.width = rect.width;
      pin.height = rect.height;
      pin.el.style.position = "fixed";
      pin.el.style.top = `${host.top + pin.pinTop}px`;
      pin.el.style.left = `${host.left + pin.pinLeft}px`;
      pin.el.style.width = `${pin.width}px`;
      pin.el.style.margin = "0";
      pin.el.style.zIndex = pin.el.style.zIndex || "20";
      pin.active = true;
      return;
    }

    pin.active = false;
    if (rest === "after") {
      const distance = this.endScroll - this.startScroll;
      pin.el.style.position = "relative";
      pin.el.style.top = `${distance}px`;
      pin.el.style.left = pin.saved.left;
      pin.el.style.width = pin.saved.width;
      pin.el.style.zIndex = pin.saved.zIndex;
      pin.el.style.margin = pin.saved.margin;
      return;
    }

    pin.el.style.position = pin.saved.position;
    pin.el.style.top = pin.saved.top;
    pin.el.style.left = pin.saved.left;
    pin.el.style.width = pin.saved.width;
    pin.el.style.zIndex = pin.saved.zIndex;
    pin.el.style.margin = pin.saved.margin;
  }

  private teardownPin() {
    if (!this.pin) return;
    this.applyPin(false, "before");
    this.pin.spacer?.remove();
    this.pin = null;
  }

  private fireEnter(back: boolean) {
    if (this.vars.once && back) return;
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
    if (this.vars.once && back) return;
    if (this.vars.scrub) {
      if (!back && this.vars.once) this.completedOnce = true;
      return;
    }
    if (back) {
      applyAction(this.animation, this.actions[3]);
      this.vars.onLeaveBack?.(this);
    } else {
      applyAction(this.animation, this.actions[1]);
      this.vars.onLeave?.(this);
      if (this.vars.once) this.completedOnce = true;
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
    const host = isWindowScroller(this.scroller)
      ? document.body
      : (this.scroller as Element);
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
      host.appendChild(el);
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

export function _scrollTriggerReset() {
  scrollTrigger.killAll();
}
