import type { ScrollTriggerVars } from "./scroll-types";

export type EaseFn = (t: number) => number;

export type EaseName =
  | "none"
  | "linear"
  | "power1.in"
  | "power1.out"
  | "power1.inOut"
  | "power2.in"
  | "power2.out"
  | "power2.inOut"
  | "power3.in"
  | "power3.out"
  | "power3.inOut"
  | "sine.in"
  | "sine.out"
  | "sine.inOut"
  | "expo.in"
  | "expo.out"
  | "expo.inOut"
  | "circ.in"
  | "circ.out"
  | "circ.inOut"
  | "back.in"
  | "back.out"
  | "back.inOut"
  | "elastic.out"
  | "bounce.out";

export type Target = object | Element | string;

export type StaggerFrom =
  | "start"
  | "end"
  | "center"
  | "edges"
  | "random"
  | number;


export type StaggerVars = {
  /** Delay between consecutive items (default when stagger is a number). */
  each?: number;
  /** Total time span to distribute across items (overrides `each`). */
  amount?: number;
  from?: StaggerFrom;
};

export type Vars = Record<string, unknown> & {
  duration?: number;
  delay?: number;
  ease?: EaseName | EaseFn;
  repeat?: number;
  /** Gap between repeats (seconds). */
  repeatDelay?: number;
  yoyo?: boolean;
  immediateRender?: boolean;
  /** Default `"auto"` — only conflicting props. `true` kills whole prior tweens. */
  overwrite?: boolean | "auto";
  stagger?: number | StaggerVars;
  scrollTrigger?: ScrollTriggerVars | boolean;
  /** Sequential or percentage keyframes (builds an internal timeline). */
  keyframes?: Vars[] | Record<string, Vars>;
  /** Start paused (drive with seek/progress or play later). */
  paused?: boolean;
  /** Playback rate (also settable via `timeScale()`). */
  timeScale?: number;
  /** Clear inline styles after complete: `"x,opacity"`, `"all"`, or `true`. */
  clearProps?: string | boolean;
  /** Animate element attributes (SVG / HTML). */
  attr?: Record<string, unknown>;
  /** CSS transform-origin (set at start, not interpolated). */
  transformOrigin?: string;
  /** Lookup via MorePass.getById(id). */
  id?: string;
  /** Snap interpolated values: increment or nearest in array. */
  snap?: Record<string, number | number[]>;
  onStart?: () => void;
  onUpdate?: () => void;
  onComplete?: () => void;
  onRepeat?: () => void;
};

export type Position = number | string;

export type TimelineVars = {
  defaults?: Partial<Vars>;
  paused?: boolean;
  timeScale?: number;
  onStart?: () => void;
  onUpdate?: () => void;
  onComplete?: () => void;
};

export type TweenState = "idle" | "active" | "paused" | "completed" | "killed";

export interface TweenControls extends PromiseLike<void> {
  play(): this;
  pause(): this;
  reverse(): this;
  restart(): this;
  kill(): this;
  seek(time: number): this;
  progress(value?: number): number | this;
  /** Get/set playback rate (1 = normal). */
  timeScale(value?: number): number | this;
  isActive(): boolean;
  /** Rebuild start/end from current state using stored raw vars. */
  invalidate(): this;
  readonly duration: number;
  readonly time: number;
  readonly totalTime: number;
}

export interface TimelineControls extends TweenControls {
  to(target: Target | Target[], vars: Vars, position?: Position): this;
  from(target: Target | Target[], vars: Vars, position?: Position): this;
  fromTo(
    target: Target | Target[],
    fromVars: Vars,
    toVars: Vars,
    position?: Position,
  ): this;
  set(target: Target | Target[], vars: Vars, position?: Position): this;
  add(child: TweenControls | TimelineControls | (() => void), position?: Position): this;
  addLabel(label: string, position?: Position): this;
  call(fn: () => void, position?: Position): this;
}
