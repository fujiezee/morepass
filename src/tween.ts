import {
  formatColor,
  isColorProp,
  mixColor,
  parseColor,
  readStyleColor,
  type RGBA,
} from "./color";
import { resolveEase } from "./ease";
import { claimProps, releaseProps, type PropOwner } from "./overwrite";
import {
  applyTransformProp,
  composeTransform,
  cssPropName,
  formatValue,
  getTransformBag,
  isTransformProp,
  parseNumeric,
  readObjectNumber,
  readStyleNumber,
  unitFor,
  type ParsedProp,
  type TransformBag,
} from "./prop";
import { ticker } from "./ticker";
import type {
  EaseFn,
  Target,
  TweenControls,
  TweenState,
  Vars,
} from "./types";

const SPECIAL = new Set([
  "duration",
  "delay",
  "ease",
  "repeat",
  "yoyo",
  "immediateRender",
  "overwrite",
  "onStart",
  "onUpdate",
  "onComplete",
  "onRepeat",
  "stagger",
]);

type ResolvedTarget = object | Element;

interface TargetRuntime {
  target: ResolvedTarget;
  isElement: boolean;
  props: ParsedProp[];
  transform: TransformBag | null;
}

export interface TweenHandle extends TweenControls, PropOwner {
  renderAt(localTime: number): void;
  readonly totalDuration: number;
  takeDelay(): number;
}

export function resolveTargets(target: Target | Target[]): ResolvedTarget[] {
  const list = Array.isArray(target) ? target : [target];
  const out: ResolvedTarget[] = [];

  for (const item of list) {
    if (typeof item === "string") {
      document.querySelectorAll(item).forEach((el) => out.push(el));
      continue;
    }
    if (item) out.push(item);
  }
  return out;
}

function propEntries(vars: Vars): [string, unknown][] {
  return Object.entries(vars).filter(([key]) => !SPECIAL.has(key));
}

function looksLikeColor(value: unknown, key: string): boolean {
  if (isColorProp(key)) return true;
  return typeof value === "string" && parseColor(value) !== null;
}

function buildProps(
  target: ResolvedTarget,
  fromVars: Vars | null,
  toVars: Vars,
  mode: "to" | "from" | "fromTo",
): { props: ParsedProp[]; transform: TransformBag | null } {
  const isElement =
    typeof Element !== "undefined" && target instanceof Element;
  const props: ParsedProp[] = [];
  let transform: TransformBag | null = null;

  const entries = propEntries(mode === "from" ? fromVars ?? toVars : toVars);

  for (const [key, endRaw] of entries) {
    const fromRaw = fromVars ? fromVars[key] : undefined;
    const kind =
      isElement && isTransformProp(key)
        ? "transform"
        : isElement
          ? "style"
          : "object";

    if (kind === "transform") {
      transform = getTransformBag(target);
    }

    // Color props
    const colorCandidate =
      kind !== "transform" &&
      (looksLikeColor(endRaw, key) ||
        (fromRaw !== undefined && looksLikeColor(fromRaw, key)));

    if (colorCandidate) {
      let startColor: RGBA;
      let endColor: RGBA;

      if (mode === "fromTo" && fromRaw !== undefined) {
        startColor = parseColor(fromRaw) ?? { r: 0, g: 0, b: 0, a: 1 };
        endColor = parseColor(endRaw) ?? startColor;
      } else if (mode === "from") {
        startColor = parseColor(endRaw) ?? { r: 0, g: 0, b: 0, a: 1 };
        if (isElement) {
          endColor = readStyleColor(target as Element, key);
        } else {
          endColor =
            parseColor((target as Record<string, unknown>)[key]) ??
            startColor;
        }
      } else {
        endColor = parseColor(endRaw) ?? { r: 0, g: 0, b: 0, a: 1 };
        if (fromRaw !== undefined) {
          startColor = parseColor(fromRaw) ?? endColor;
        } else if (isElement) {
          startColor = readStyleColor(target as Element, key);
        } else {
          startColor =
            parseColor((target as Record<string, unknown>)[key]) ?? endColor;
        }
      }

      props.push({
        key,
        kind,
        valueType: "color",
        start: 0,
        end: 1,
        unit: "",
        startColor,
        endColor,
        active: true,
      });
      continue;
    }

    let startNum: number;
    let endNum: number;
    let unit = "";

    if (mode === "fromTo" && fromRaw !== undefined) {
      const endParsed = parseNumeric(
        endRaw,
        unitFor(key, ""),
      ) ?? { num: 0, unit: "" };
      const startParsed = parseNumeric(
        fromRaw,
        unitFor(key, endParsed.unit),
      ) ?? { num: 0, unit: endParsed.unit };
      startNum = startParsed.num;
      endNum = endParsed.num;
      unit = unitFor(key, endParsed.unit || startParsed.unit);
    } else if (mode === "from") {
      const startParsed = parseNumeric(
        endRaw,
        unitFor(key, ""),
      ) ?? { num: 0, unit: "" };
      unit = unitFor(key, startParsed.unit);
      startNum = startParsed.num;
      if (isElement && kind !== "object") {
        if (kind === "transform") {
          endNum =
            key === "scale" || key === "scaleX" || key === "scaleY" ? 1 : 0;
        } else {
          endNum = readStyleNumber(target as Element, key).num;
        }
      } else {
        endNum = readObjectNumber(target as object, key);
      }
    } else {
      const endParsed = parseNumeric(
        endRaw,
        unitFor(key, ""),
      ) ?? { num: Number(endRaw) || 0, unit: "" };
      unit = unitFor(key, endParsed.unit);
      endNum = endParsed.num;

      if (fromRaw !== undefined) {
        startNum =
          parseNumeric(fromRaw, unit)?.num ??
          (typeof fromRaw === "number" ? fromRaw : 0);
      } else if (isElement && kind === "style") {
        const current = readStyleNumber(target as Element, key);
        startNum = current.num;
        if (!unit) unit = current.unit;
      } else if (kind === "transform") {
        // Prefer live bag values so chained tweens start from current pose
        const bag = getTransformBag(target);
        if (key === "scale") startNum = bag.scaleX;
        else startNum = (bag as unknown as Record<string, number>)[key] ?? 0;
      } else {
        startNum = readObjectNumber(target as object, key);
      }
    }

    props.push({
      key,
      kind,
      valueType: "number",
      start: startNum,
      end: endNum,
      unit,
      active: true,
    });
  }

  return { props, transform };
}

function renderTarget(runtime: TargetRuntime, ratio: number) {
  const { target, isElement, props, transform } = runtime;
  let wroteTransform = false;

  for (const prop of props) {
    if (!prop.active) continue;

    if (prop.valueType === "color" && prop.startColor && prop.endColor) {
      const mixed = mixColor(prop.startColor, prop.endColor, ratio);
      const formatted = formatColor(mixed);
      if (prop.kind === "style" && isElement) {
        (target as HTMLElement).style.setProperty(
          cssPropName(prop.key),
          formatted,
        );
      } else {
        (target as Record<string, unknown>)[prop.key] = formatted;
      }
      continue;
    }

    const value = prop.start + (prop.end - prop.start) * ratio;
    if (prop.kind === "transform" && transform) {
      applyTransformProp(transform, prop.key, value);
      wroteTransform = true;
      continue;
    }
    if (prop.kind === "style" && isElement) {
      (target as HTMLElement).style.setProperty(
        cssPropName(prop.key),
        formatValue(value, prop.unit),
      );
      continue;
    }
    (target as Record<string, unknown>)[prop.key] = value;
  }

  if (wroteTransform && transform && isElement) {
    (target as HTMLElement).style.transform = composeTransform(transform);
  }
}

class Tween implements TweenHandle {
  private state: TweenState = "idle";
  private readonly targets: TargetRuntime[];
  private readonly ease: EaseFn;
  private delay: number;
  private readonly durationSec: number;
  private readonly yoyo: boolean;
  private readonly overwrite: boolean | "auto";
  private readonly onStart?: () => void;
  private readonly onUpdate?: () => void;
  private readonly onComplete?: () => void;

  private startWall = 0;
  private pauseWall = 0;
  private elapsed = 0;
  private iteration = 0;
  private playingForward = true;
  private startedCallback = false;
  private completedCallback = false;
  private claimed = false;
  private unsub: (() => void) | null = null;
  private ratio = 0;
  private readonly totalIterations: number;

  constructor(targets: TargetRuntime[], vars: Vars) {
    this.targets = targets;
    this.ease = resolveEase(vars.ease);
    this.delay = Math.max(0, vars.delay ?? 0);
    this.durationSec = Math.max(0, vars.duration ?? 0.5);
    const repeat = vars.repeat ?? 0;
    this.totalIterations = repeat < 0 ? Number.POSITIVE_INFINITY : repeat;
    this.yoyo = !!vars.yoyo;
    this.overwrite = vars.overwrite ?? "auto";
    this.onStart = vars.onStart;
    this.onUpdate = vars.onUpdate;
    this.onComplete = vars.onComplete;
  }

  get duration() {
    return this.durationSec;
  }

  get totalDuration() {
    if (!Number.isFinite(this.totalIterations)) return Number.POSITIVE_INFINITY;
    return this.durationSec * (this.totalIterations + 1);
  }

  get time() {
    return this.elapsed;
  }

  get totalTime() {
    return this.delay + this.elapsed;
  }

  takeDelay() {
    const d = this.delay;
    this.delay = 0;
    return d;
  }

  play() {
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
      this.startWall = performance.now() / 1000;
      if (this.durationSec === 0 && this.delay === 0) {
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
    this.playingForward = !this.playingForward;
    if (this.state === "idle" || this.state === "completed") {
      this.state = "idle";
      this.startedCallback = false;
      this.completedCallback = false;
      this.play();
    }
    return this;
  }

  restart() {
    this.clearTicker();
    this.releaseClaims();
    this.state = "idle";
    this.elapsed = 0;
    this.iteration = 0;
    this.playingForward = true;
    this.startedCallback = false;
    this.completedCallback = false;
    this.claimed = false;
    this.ratio = 0;
    for (const runtime of this.targets) {
      for (const prop of runtime.props) prop.active = true;
    }
    return this.play();
  }

  kill() {
    this.releaseClaims();
    this.state = "killed";
    this.clearTicker();
    this.targets.length = 0;
    return this;
  }

  killAll() {
    this.kill();
  }

  killProps(keys: string[]) {
    const set = new Set(keys);
    if (set.has("scale")) {
      set.add("scaleX");
      set.add("scaleY");
    }
    for (const runtime of this.targets) {
      for (const prop of runtime.props) {
        if (set.has(prop.key)) prop.active = false;
      }
    }
  }

  seek(time: number) {
    this.renderAt(time);
    return this;
  }

  progress(value?: number) {
    if (value === undefined) return this.ratio;
    this.renderAt(value * this.durationSec);
    return this;
  }

  isActive() {
    return this.state === "active";
  }

  renderStart() {
    this.apply(0);
  }

  renderAt(localTime: number) {
    if (this.state === "killed") return;

    if (localTime < 0) {
      this.apply(0);
      return;
    }

    if (!this.startedCallback && localTime >= 0) {
      this.startedCallback = true;
      this.claim();
      this.onStart?.();
    }

    const total = this.totalDuration;
    if (this.durationSec === 0) {
      this.apply(1);
      if (!this.completedCallback) this.finish();
      return;
    }

    if (localTime >= total) {
      const endP = this.yoyo && this.totalIterations % 2 === 1 ? 0 : 1;
      this.elapsed = this.durationSec;
      this.apply(this.playingForward ? endP : 1 - endP);
      if (!this.completedCallback) this.finish();
      return;
    }

    this.completedCallback = false;
    if (this.state !== "paused") this.state = "active";

    const cycle = Math.floor(localTime / this.durationSec);
    const into = localTime % this.durationSec;
    this.iteration = cycle;
    this.elapsed = into;

    let p = into / this.durationSec;
    if (!this.playingForward) p = 1 - p;
    if (this.yoyo && cycle % 2 === 1) p = 1 - p;
    this.apply(p);
  }

  private claim() {
    if (this.claimed || this.overwrite === false) return;
    this.claimed = true;
    for (const runtime of this.targets) {
      const keys = runtime.props.filter((p) => p.active).map((p) => p.key);
      claimProps(runtime.target, keys, this, this.overwrite);
    }
  }

  private releaseClaims() {
    if (!this.claimed) return;
    for (const runtime of this.targets) {
      const keys = runtime.props.map((p) => p.key);
      releaseProps(runtime.target, keys, this);
    }
    this.claimed = false;
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
    const local = wall - this.startWall - this.delay;
    this.renderAt(local);
    if (local >= this.totalDuration) {
      this.clearTicker();
    }
  }

  private apply(p: number) {
    const ratio = this.ease(p);
    this.ratio = ratio;
    for (const runtime of this.targets) renderTarget(runtime, ratio);
    this.onUpdate?.();
  }

  private finish() {
    this.state = "completed";
    this.releaseClaims();
    if (!this.completedCallback) {
      this.completedCallback = true;
      this.onComplete?.();
    }
    this.clearTicker();
  }
}

export type TweenMode = "to" | "from" | "fromTo";

export function createTweenHandle(
  target: Target | Target[],
  fromVars: Vars | null,
  toVars: Vars,
  mode: TweenMode,
  options: { autoPlay?: boolean } = {},
): TweenHandle {
  const resolved = resolveTargets(target);
  const runtimes: TargetRuntime[] = resolved.map((item) => {
    const { props, transform } = buildProps(item, fromVars, toVars, mode);
    return {
      target: item,
      isElement: typeof Element !== "undefined" && item instanceof Element,
      props,
      transform,
    };
  });

  const vars = mode === "from" ? (fromVars ?? toVars) : toVars;
  const tween = new Tween(runtimes, vars);

  const immediate =
    vars.immediateRender ?? (mode === "from" || mode === "fromTo");
  if (immediate) tween.renderStart();

  if (options.autoPlay !== false) tween.play();
  return tween;
}

export function isTweenHandle(value: unknown): value is TweenHandle {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as TweenHandle).renderAt === "function" &&
    typeof (value as TweenHandle).totalDuration === "number"
  );
}
