import {
  formatColor,
  isColorProp,
  mixColor,
  parseColor,
  readStyleColor,
  type RGBA,
} from "./color";
import { collectIntoContext } from "./context";
import { mergeDefaults } from "./defaults";
import { resolveEase } from "./ease";
import { claimProps, releaseProps, type PropOwner } from "./overwrite";
import {
  applyRelative,
  applyTransformProp,
  composeTransform,
  cssPropName,
  formatValue,
  getTransformBag,
  isTransformProp,
  parseNumeric,
  parseRelative,
  readAttrNumber,
  readObjectNumber,
  readStyleNumber,
  unitFor,
  type ParsedProp,
  type TransformBag,
} from "./prop";
import { registerId, unregisterId } from "./ids";
import { registerTween, unregisterTween } from "./registry";
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
  "repeatDelay",
  "yoyo",
  "immediateRender",
  "overwrite",
  "onStart",
  "onUpdate",
  "onComplete",
  "onRepeat",
  "stagger",
  "scrollTrigger",
  "keyframes",
  "paused",
  "timeScale",
  "clearProps",
  "attr",
  "transformOrigin",
  "id",
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

  // Expand attr:{} into attribute props
  const attrTo = (toVars.attr ?? {}) as Record<string, unknown>;
  const attrFrom = (fromVars?.attr ?? {}) as Record<string, unknown>;
  const attrKeys = new Set([
    ...Object.keys(attrTo),
    ...(mode === "from" || mode === "fromTo" ? Object.keys(attrFrom) : []),
  ]);
  for (const key of attrKeys) {
    const endRaw =
      mode === "from"
        ? (attrFrom[key] ?? attrTo[key])
        : (attrTo[key] ?? attrFrom[key]);
    if (endRaw !== undefined) entries.push([`@attr:${key}`, endRaw]);
  }

  for (const [rawKey, endRaw] of entries) {
    const isAttr = rawKey.startsWith("@attr:");
    const key = isAttr ? rawKey.slice(6) : rawKey;
    const fromRaw = isAttr
      ? attrFrom[key]
      : fromVars
        ? fromVars[key]
        : undefined;
    const isAutoAlpha = key === "autoAlpha";
    const isCssVar = key.startsWith("--");
    const readKey = isAutoAlpha ? "opacity" : key;
    const kind =
      isAttr && isElement
        ? "attr"
        : isElement && isTransformProp(key)
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
      kind !== "attr" &&
      !isAutoAlpha &&
      !isCssVar &&
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
      const startParsed = parseNumeric(
        fromRaw,
        unitFor(readKey, ""),
      ) ?? { num: typeof fromRaw === "number" ? fromRaw : 0, unit: "" };
      startNum = startParsed.num;
      unit = unitFor(readKey, startParsed.unit);
      const rel = parseRelative(endRaw);
      if (rel) {
        endNum = applyRelative(startNum, rel);
        if (rel.unit) unit = unitFor(readKey, rel.unit);
      } else {
        const endParsed = parseNumeric(
          endRaw,
          unit,
        ) ?? { num: Number(endRaw) || 0, unit: "" };
        endNum = endParsed.num;
        unit = unitFor(readKey, endParsed.unit || unit);
      }
    } else if (mode === "from") {
      const rel = parseRelative(endRaw);
      if (rel) {
        // from relative: start = current ± delta
        if (isElement && kind === "transform") {
          const bag = getTransformBag(target);
          const current =
            key === "scale"
              ? bag.scaleX
              : ((bag as unknown as Record<string, number>)[key] ?? 0);
          startNum = applyRelative(current, rel);
          endNum = current;
        } else if (isElement && kind === "attr") {
          endNum = readAttrNumber(target as Element, key);
          startNum = applyRelative(endNum, rel);
        } else if (isElement && kind === "style") {
          endNum = readStyleNumber(target as Element, readKey).num;
          startNum = applyRelative(endNum, rel);
        } else {
          endNum = readObjectNumber(target as object, readKey);
          startNum = applyRelative(endNum, rel);
        }
        unit = unitFor(readKey, rel.unit);
      } else {
        const startParsed = parseNumeric(
          endRaw,
          unitFor(readKey, ""),
        ) ?? { num: 0, unit: "" };
        unit = unitFor(readKey, startParsed.unit);
        startNum = startParsed.num;
        if (isElement && kind !== "object") {
          if (kind === "transform") {
            endNum =
              key === "scale" || key === "scaleX" || key === "scaleY" ? 1 : 0;
          } else if (kind === "attr") {
            endNum = readAttrNumber(target as Element, key);
          } else {
            endNum = readStyleNumber(target as Element, readKey).num;
          }
        } else {
          endNum = readObjectNumber(target as object, readKey);
        }
      }
    } else {
      if (fromRaw !== undefined) {
        startNum =
          parseNumeric(fromRaw, unitFor(readKey, ""))?.num ??
          (typeof fromRaw === "number" ? fromRaw : 0);
        unit = unitFor(
          readKey,
          parseNumeric(fromRaw, "")?.unit ?? "",
        );
      } else if (isElement && kind === "style") {
        const current = readStyleNumber(target as Element, readKey);
        startNum = current.num;
        unit = current.unit;
      } else if (isElement && kind === "attr") {
        startNum = readAttrNumber(target as Element, key);
      } else if (kind === "transform") {
        const bag = getTransformBag(target);
        if (key === "scale") startNum = bag.scaleX;
        else startNum = (bag as unknown as Record<string, number>)[key] ?? 0;
      } else {
        startNum = readObjectNumber(target as object, readKey);
      }

      const rel = parseRelative(endRaw);
      if (rel) {
        endNum = applyRelative(startNum, rel);
        unit = unitFor(readKey, rel.unit || unit);
      } else {
        const endParsed = parseNumeric(
          endRaw,
          unitFor(readKey, unit),
        ) ?? { num: Number(endRaw) || 0, unit: "" };
        endNum = endParsed.num;
        unit = unitFor(readKey, endParsed.unit || unit);
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
      if (prop.key === "autoAlpha") {
        const el = target as HTMLElement;
        el.style.opacity = String(value);
        el.style.visibility = value <= 0.001 ? "hidden" : "inherit";
        continue;
      }
      (target as HTMLElement).style.setProperty(
        cssPropName(prop.key),
        formatValue(value, prop.unit),
      );
      continue;
    }
    if (prop.kind === "attr" && isElement) {
      (target as Element).setAttribute(
        prop.key,
        formatValue(value, prop.unit),
      );
      continue;
    }
    if (prop.key === "autoAlpha") {
      (target as Record<string, unknown>).opacity = value;
      (target as Record<string, unknown>).autoAlpha = value;
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
  private readonly repeatDelaySec: number;
  private readonly onStart?: () => void;
  private readonly onUpdate?: () => void;
  private readonly onComplete?: () => void;
  private readonly onRepeat?: () => void;
  private readonly clearProps: string | boolean | undefined;
  private readonly transformOrigin?: string;
  private readonly tweenId?: string;

  private startWall = 0;
  private pauseWall = 0;
  private elapsed = 0;
  private iteration = 0;
  private lastRepeatFired = -1;
  private playingForward = true;
  private scale = 1;
  private startedCallback = false;
  private completedCallback = false;
  private claimed = false;
  private registered = false;
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
    this.repeatDelaySec = Math.max(0, vars.repeatDelay ?? 0);
    this.scale = vars.timeScale ?? 1;
    this.onStart = vars.onStart;
    this.onUpdate = vars.onUpdate;
    this.onComplete = vars.onComplete;
    this.onRepeat = vars.onRepeat;
    this.clearProps = vars.clearProps;
    this.transformOrigin =
      typeof vars.transformOrigin === "string"
        ? vars.transformOrigin
        : undefined;
    this.tweenId = typeof vars.id === "string" ? vars.id : undefined;
    this.register();
    if (this.tweenId) registerId(this.tweenId, this);
  }

  get duration() {
    return this.durationSec;
  }

  get totalDuration() {
    if (!Number.isFinite(this.totalIterations)) return Number.POSITIVE_INFINITY;
    const reps = this.totalIterations;
    return (
      this.durationSec * (reps + 1) + this.repeatDelaySec * reps
    );
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

  private cycleLength() {
    return this.durationSec + this.repeatDelaySec;
  }

  private register() {
    if (this.registered) return;
    this.registered = true;
    registerTween(
      this.targets.map((t) => t.target),
      this,
    );
  }

  private unregister() {
    if (!this.registered) return;
    this.registered = false;
    unregisterTween(
      this.targets.map((t) => t.target),
      this,
    );
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
    this.lastRepeatFired = -1;
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
    this.unregister();
    if (this.tweenId) unregisterId(this.tweenId, this);
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
    if (set.has("autoAlpha")) set.add("opacity");
    if (set.has("opacity")) set.add("autoAlpha");
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

  timeScale(value?: number) {
    if (value === undefined) return this.scale;
    const now = performance.now() / 1000;
    const local = (now - this.startWall - this.delay) * this.scale;
    this.scale = value === 0 ? 0.0001 : value;
    this.startWall = now - this.delay - local / this.scale;
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

    // Not started yet — leave the target alone so earlier timeline
    // children keep their interpolated values.
    if (localTime < 0) return;

    if (!this.startedCallback) {
      this.startedCallback = true;
      this.applyTransformOrigin();
      this.claim();
      this.onStart?.();
    }

    const total = this.totalDuration;
    if (this.durationSec === 0) {
      this.apply(1);
      if (!this.completedCallback) this.finish();
      return;
    }

    if (Number.isFinite(total) && localTime >= total) {
      const endP = this.yoyo && this.totalIterations % 2 === 1 ? 0 : 1;
      this.elapsed = this.durationSec;
      this.apply(this.playingForward ? endP : 1 - endP);
      if (!this.completedCallback) this.finish();
      return;
    }

    this.completedCallback = false;
    if (this.state !== "paused") this.state = "active";

    const cycleLen = this.cycleLength();
    let cycle: number;
    let into: number;

    if (this.repeatDelaySec > 0 && Number.isFinite(this.totalIterations)) {
      cycle = Math.min(
        Math.floor(localTime / cycleLen),
        this.totalIterations,
      );
      const cycleStart = cycle * cycleLen;
      into = localTime - cycleStart;
      if (into > this.durationSec) into = this.durationSec;
    } else if (this.repeatDelaySec > 0) {
      cycle = Math.floor(localTime / cycleLen);
      into = Math.min(localTime - cycle * cycleLen, this.durationSec);
    } else {
      cycle = Math.floor(localTime / this.durationSec);
      into = localTime % this.durationSec;
    }

    if (cycle > 0 && cycle !== this.lastRepeatFired && cycle > this.iteration) {
      this.onRepeat?.();
      this.lastRepeatFired = cycle;
    }
    this.iteration = cycle;
    this.elapsed = into;

    let p =
      this.durationSec === 0 ? 1 : into / this.durationSec;
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
    const local = (wall - this.startWall - this.delay) * this.scale;
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
    this.applyClearProps();
    this.releaseClaims();
    if (!this.completedCallback) {
      this.completedCallback = true;
      this.onComplete?.();
    }
    this.clearTicker();
  }

  private applyTransformOrigin() {
    if (!this.transformOrigin) return;
    for (const runtime of this.targets) {
      if (!runtime.isElement) continue;
      (runtime.target as HTMLElement).style.transformOrigin =
        this.transformOrigin;
    }
  }

  private applyClearProps() {
    if (this.clearProps == null || this.clearProps === false) return;
    const all = this.clearProps === true || this.clearProps === "all";
    for (const runtime of this.targets) {
      if (!runtime.isElement) continue;
      const el = runtime.target as HTMLElement;
      const keys = all
        ? runtime.props.map((p) => p.key)
        : String(this.clearProps)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);

      let clearTransform = false;
      for (const key of keys) {
        if (isTransformProp(key) || key === "transform") {
          clearTransform = true;
          continue;
        }
        if (key === "autoAlpha") {
          el.style.removeProperty("opacity");
          el.style.removeProperty("visibility");
          continue;
        }
        const attrProp = runtime.props.find(
          (p) => p.key === key && p.kind === "attr",
        );
        if (attrProp) {
          el.removeAttribute(key);
          continue;
        }
        el.style.removeProperty(cssPropName(key));
      }
      if (clearTransform) {
        el.style.removeProperty("transform");
      }
    }
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
  const mergedTo = mergeDefaults(toVars);
  const mergedFrom = fromVars ? mergeDefaults(fromVars) : null;
  const resolved = resolveTargets(target);
  const runtimes: TargetRuntime[] = resolved.map((item) => {
    const { props, transform } = buildProps(
      item,
      mergedFrom,
      mergedTo,
      mode,
    );
    return {
      target: item,
      isElement: typeof Element !== "undefined" && item instanceof Element,
      props,
      transform,
    };
  });

  const vars = mode === "from" ? (mergedFrom ?? mergedTo) : mergedTo;
  const tween = new Tween(runtimes, vars);
  collectIntoContext(tween);

  const immediate =
    vars.immediateRender ?? (mode === "from" || mode === "fromTo");
  if (immediate) tween.renderStart();

  const shouldPlay =
    options.autoPlay !== false && !vars.paused && !vars.scrollTrigger;
  if (shouldPlay) tween.play();
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
