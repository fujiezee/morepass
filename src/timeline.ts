import { ticker } from "./ticker";
import {
  createTweenHandle,
  isTweenHandle,
  type TweenHandle,
} from "./tween";
import type {
  Position,
  Target,
  TimelineControls,
  TimelineVars,
  TweenControls,
  TweenState,
  Vars,
} from "./types";

type ChildKind = "tween" | "callback";

interface TimelineChild {
  kind: ChildKind;
  start: number;
  duration: number;
  tween?: TweenHandle;
  callback?: () => void;
  called?: boolean;
}

const REL_RE = /^(.*?)?([+-]=)([+-]?\d*\.?\d+)$/;

function mergeDefaults(defaults: Partial<Vars> | undefined, vars: Vars): Vars {
  if (!defaults) return vars;
  return { ...defaults, ...vars };
}

export class Timeline implements TimelineControls {
  private state: TweenState = "idle";
  private readonly children: TimelineChild[] = [];
  private readonly labels = new Map<string, number>();
  private readonly defaults: Partial<Vars>;
  private readonly onStart?: () => void;
  private readonly onUpdate?: () => void;
  private readonly onComplete?: () => void;

  private startWall = 0;
  private pauseWall = 0;
  private elapsed = 0;
  private playingForward = true;
  private startedCallback = false;
  private completedCallback = false;
  private unsub: (() => void) | null = null;
  private lastChildStart = 0;
  private lastChildEnd = 0;
  private ratio = 0;
  private total = 0;

  constructor(vars: TimelineVars = {}) {
    this.defaults = vars.defaults ?? {};
    this.onStart = vars.onStart;
    this.onUpdate = vars.onUpdate;
    this.onComplete = vars.onComplete;
    if (!vars.paused) {
      // stay idle until first play or until children added then auto? GSAP autoplays.
      // We'll autoplay on first child add if not paused — match GSAP: timelines play by default.
      this.state = "idle";
    } else {
      this.state = "paused";
    }
    if (!vars.paused) {
      // defer play until something exists; play() is called after adds typically.
      // Auto-start when play() is invoked. For convenience, call play() at end of microtask if children exist — skip; user/demo will call play.
    }
  }

  get duration() {
    return this.total;
  }

  get time() {
    return this.elapsed;
  }

  get totalTime() {
    return this.elapsed;
  }

  to(target: Target | Target[], vars: Vars, position?: Position) {
    const tween = createTweenHandle(
      target,
      null,
      mergeDefaults(this.defaults, vars),
      "to",
      { autoPlay: false },
    );
    this.placeTween(tween, position);
    return this;
  }

  from(target: Target | Target[], vars: Vars, position?: Position) {
    const merged = mergeDefaults(this.defaults, vars);
    const tween = createTweenHandle(target, merged, merged, "from", {
      autoPlay: false,
    });
    this.placeTween(tween, position);
    return this;
  }

  fromTo(
    target: Target | Target[],
    fromVars: Vars,
    toVars: Vars,
    position?: Position,
  ) {
    const tween = createTweenHandle(
      target,
      fromVars,
      mergeDefaults(this.defaults, toVars),
      "fromTo",
      { autoPlay: false },
    );
    this.placeTween(tween, position);
    return this;
  }

  set(target: Target | Target[], vars: Vars, position?: Position) {
    return this.to(target, { ...vars, duration: 0, ease: "none" }, position);
  }

  add(
    child: TweenControls | TimelineControls | (() => void),
    position?: Position,
  ) {
    if (typeof child === "function") {
      return this.call(child, position);
    }
    if (isTweenHandle(child)) {
      // Stop standalone ticker if any
      child.pause();
      this.placeTween(child, position);
      return this;
    }
    // Nested timeline: flatten by seeking nested duration as a unit via wrapper
    if (child && typeof (child as TimelineControls).to === "function") {
      const nested = child as Timeline;
      nested.pause();
      const start = this.resolvePosition(position) + 0;
      const duration = nested.duration;
      // Drive nested by wrapping render
      const proxy: TweenHandle = {
        duration: nested.duration,
        totalDuration: nested.duration,
        time: 0,
        totalTime: 0,
        play: () => proxy,
        pause: () => proxy,
        reverse: () => proxy,
        restart: () => proxy,
        kill: () => {
          nested.kill();
          return proxy;
        },
        killAll: () => {
          nested.kill();
        },
        killProps: () => {
          // Nested timeline owns its own children; no-op at proxy level.
        },
        seek: (t: number) => {
          nested.seek(t);
          return proxy;
        },
        progress: (v?: number) => {
          if (v === undefined) return nested.progress() as number;
          nested.progress(v);
          return proxy;
        },
        isActive: () => nested.isActive(),
        renderAt: (t: number) => {
          nested.seek(Math.max(0, t));
        },
        takeDelay: () => 0,
      };
      this.children.push({
        kind: "tween",
        start,
        duration,
        tween: proxy,
      });
      this.lastChildStart = start;
      this.lastChildEnd = start + duration;
      this.recomputeTotal();
      this.ensurePlaying();
      return this;
    }
    return this;
  }

  addLabel(label: string, position?: Position) {
    const time = this.resolvePosition(position);
    this.labels.set(label, time);
    return this;
  }

  call(fn: () => void, position?: Position) {
    const start = this.resolvePosition(position);
    this.children.push({
      kind: "callback",
      start,
      duration: 0,
      callback: fn,
      called: false,
    });
    this.lastChildStart = start;
    this.lastChildEnd = start;
    this.recomputeTotal();
    this.ensurePlaying();
    return this;
  }

  play(): this {
    if (this.state === "killed") return this;
    if (this.state === "completed") {
      this.restart();
      return this;
    }
    if (this.state === "paused") {
      this.startWall += performance.now() / 1000 - this.pauseWall;
      this.state = "active";
      this.ensureTicker();
      return this;
    }
    if (this.state === "idle") {
      this.state = "active";
      this.startWall = performance.now() / 1000 - this.elapsed;
      if (this.total === 0) {
        this.renderAt(0);
        this.finish();
        return this;
      }
      this.ensureTicker();
    }
    return this;
  }

  pause() {
    if (this.state !== "active") return this;
    this.state = "paused";
    this.pauseWall = performance.now() / 1000;
    this.clearTicker();
    return this;
  }

  reverse() {
    const now = performance.now() / 1000;
    const current = this.elapsed;
    this.playingForward = !this.playingForward;
    if (this.playingForward) {
      this.startWall = now - current;
    } else {
      this.startWall = now - (this.total - current);
    }
    if (this.state === "completed" || this.state === "idle") {
      this.completedCallback = false;
      this.state = "idle";
      this.play();
    }
    return this;
  }

  restart(): this {
    this.clearTicker();
    this.state = "idle";
    this.elapsed = 0;
    this.playingForward = true;
    this.startedCallback = false;
    this.completedCallback = false;
    for (const child of this.children) {
      if (child.kind === "callback") child.called = false;
    }
    this.renderAt(0);
    this.play();
    return this;
  }

  kill() {
    this.state = "killed";
    this.clearTicker();
    for (const child of this.children) child.tween?.kill();
    this.children.length = 0;
    return this;
  }

  seek(time: number) {
    this.renderAt(time);
    this.elapsed = Math.max(0, Math.min(this.total, time));
    return this;
  }

  progress(value?: number) {
    if (value === undefined) return this.ratio;
    this.seek(value * (this.total || 1));
    return this;
  }

  isActive() {
    return this.state === "active";
  }

  private placeTween(tween: TweenHandle, position?: Position) {
    const delay = tween.takeDelay();
    const start = this.resolvePosition(position) + delay;
    const duration = Number.isFinite(tween.totalDuration)
      ? tween.totalDuration
      : tween.duration;

    this.children.push({
      kind: "tween",
      start,
      duration,
      tween,
    });
    this.lastChildStart = start;
    this.lastChildEnd = start + duration;
    this.recomputeTotal();
    this.ensurePlaying();
  }

  private resolvePosition(position?: Position): number {
    if (position === undefined) return this.total;

    if (typeof position === "number") return Math.max(0, position);

    const raw = position.trim();
    if (raw === "<") return this.lastChildStart;
    if (raw === ">") return this.lastChildEnd;

    if (raw.startsWith("<") || raw.startsWith(">")) {
      const base = raw[0] === "<" ? this.lastChildStart : this.lastChildEnd;
      const offset = parseFloat(raw.slice(1)) || 0;
      return Math.max(0, base + offset);
    }

    const rel = REL_RE.exec(raw);
    if (rel) {
      const label = rel[1];
      const op = rel[2];
      const amount = parseFloat(rel[3]) || 0;
      const base = label
        ? (this.labels.get(label) ?? this.total)
        : this.total;
      return Math.max(0, op === "+=" ? base + amount : base - amount);
    }

    if (this.labels.has(raw)) return this.labels.get(raw)!;

    const asNum = Number(raw);
    if (!Number.isNaN(asNum)) return Math.max(0, asNum);

    return this.total;
  }

  private recomputeTotal() {
    let max = 0;
    for (const child of this.children) {
      max = Math.max(max, child.start + child.duration);
    }
    for (const t of this.labels.values()) max = Math.max(max, t);
    this.total = max;
  }

  private ensurePlaying() {
    if (this.state === "paused" || this.state === "killed") return;
    if (this.state === "idle" || this.state === "completed") {
      this.completedCallback = false;
      this.play();
    }
  }

  private ensureTicker() {
    if (this.unsub) return;
    this.unsub = ticker.add((wall) => this.tick(wall));
  }

  private clearTicker() {
    if (!this.unsub) return;
    this.unsub();
    this.unsub = null;
  }

  private tick(wall: number) {
    if (this.state !== "active") return;
    const raw = wall - this.startWall;
    const local = this.playingForward ? raw : this.total - raw;
    this.renderAt(local);

    const done = this.playingForward ? local >= this.total : local <= 0;
    if (done) this.finish();
  }

  private renderAt(time: number) {
    if (this.state === "killed") return;

    const t = Math.max(0, Math.min(this.total || 0, time));
    this.elapsed = t;
    this.ratio = this.total ? t / this.total : 1;

    if (!this.startedCallback && (t > 0 || this.total === 0)) {
      this.startedCallback = true;
      this.onStart?.();
    }

    // Stable order: earlier start first; same start by insert order
    for (const child of this.children) {
      if (child.kind === "callback") {
        if (t >= child.start && !child.called) {
          child.called = true;
          child.callback?.();
        } else if (t < child.start) {
          child.called = false;
        }
        continue;
      }
      const local = t - child.start;
      child.tween?.renderAt(local);
    }

    this.onUpdate?.();
  }

  private finish() {
    this.state = "completed";
    this.clearTicker();
    if (!this.completedCallback) {
      this.completedCallback = true;
      this.onComplete?.();
    }
  }
}

export function timeline(vars?: TimelineVars): TimelineControls {
  return new Timeline(vars);
}
