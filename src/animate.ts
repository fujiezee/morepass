import { createScrollTrigger } from "./scroll-trigger";
import type { ScrollTriggerVars } from "./scroll-types";
import { mapFunctionValues, resolveStaggerDelay } from "./stagger";
import { timeline } from "./timeline";
import {
  createTweenHandle,
  resolveTargets,
  type TweenMode,
} from "./tween";
import type {
  Target,
  TimelineControls,
  TweenControls,
  Vars,
} from "./types";

function stripSpecial(vars: Vars): Vars {
  const {
    stagger: _s,
    scrollTrigger: _st,
    keyframes: _k,
    ...rest
  } = vars;
  return rest;
}

function hasStagger(vars: Vars, targetCount: number): boolean {
  return vars.stagger != null && targetCount > 1;
}

function attachScrollTrigger(
  target: Target | Target[],
  vars: Vars,
  animation: TweenControls,
): TweenControls {
  const raw = vars.scrollTrigger;
  if (raw == null || raw === false) return animation;

  const stVars: ScrollTriggerVars =
    raw === true ? { animation } : { ...raw, animation };

  if (!stVars.trigger) {
    const first = resolveTargets(target).find(
      (t): t is Element =>
        typeof Element !== "undefined" && t instanceof Element,
    );
    if (first) stVars.trigger = first;
  }

  createScrollTrigger(stVars);
  return animation;
}

function parsePercent(key: string): number | null {
  const m = /^(\d+(?:\.\d+)?)%$/.exec(key.trim());
  if (!m) return null;
  return parseFloat(m[1]) / 100;
}

const KEYFRAME_SKIP = new Set([
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
  "scrollTrigger",
  "keyframes",
  "paused",
]);

function propOnly(vars: Vars): Vars {
  const out: Vars = {};
  for (const [key, value] of Object.entries(vars)) {
    if (!KEYFRAME_SKIP.has(key)) out[key] = value;
  }
  return out;
}

function createKeyframes(
  target: Target | Target[],
  vars: Vars,
): TimelineControls {
  const frames = vars.keyframes!;
  const {
    keyframes: _k,
    stagger: _s,
    scrollTrigger: _st,
    paused,
    duration: defaultDuration = 0.5,
    ease: defaultEase,
    delay = 0,
    onStart,
    onUpdate,
    onComplete,
    ...shared
  } = vars;

  const tl = timeline({
    paused: true,
    onStart,
    onUpdate,
    onComplete,
  });

  // Accumulate end values so each segment starts where the previous ended
  // (create-time `to()` would otherwise snapshot every start as the initial state).
  let accumulated: Vars = {};

  if (Array.isArray(frames)) {
    let pos: number | string = delay;
    for (const frame of frames) {
      const toProps = propOnly({ ...shared, ...frame });
      const fromProps: Vars = {};
      for (const key of Object.keys(toProps)) {
        if (key in accumulated) fromProps[key] = accumulated[key];
      }
      const step: Vars = {
        duration: (frame.duration as number | undefined) ?? defaultDuration,
        ease: (frame.ease as Vars["ease"]) ?? defaultEase,
        ...toProps,
        delay: 0,
        immediateRender: false,
      };
      if (Object.keys(fromProps).length > 0) {
        tl.fromTo(target, fromProps, step, pos);
      } else {
        tl.to(target, step, pos);
      }
      accumulated = { ...accumulated, ...toProps };
      pos = ">";
    }
  } else {
    // percentage map: { "0%": {...}, "50%": {...}, "100%": {...} }
    const entries = Object.entries(frames)
      .map(([key, frame]) => ({
        pct: parsePercent(key) ?? 0,
        frame,
      }))
      .sort((a, b) => a.pct - b.pct);

    const total = defaultDuration;
    let prevPct = 0;
    for (const { pct, frame } of entries) {
      const segDuration = Math.max(0, (pct - prevPct) * total);
      const toProps = propOnly({ ...shared, ...frame });
      const fromProps: Vars = {};
      for (const key of Object.keys(toProps)) {
        if (key in accumulated) fromProps[key] = accumulated[key];
      }
      const step: Vars = {
        ...toProps,
        duration: segDuration,
        ease: frame.ease ?? defaultEase,
        delay: 0,
        immediateRender: false,
      };
      const start = delay + prevPct * total;
      if (segDuration === 0) {
        tl.set(target, step, start);
      } else if (Object.keys(fromProps).length > 0) {
        tl.fromTo(target, fromProps, step, start);
      } else {
        tl.to(target, step, start);
      }
      accumulated = { ...accumulated, ...toProps };
      prevPct = pct;
    }
  }

  if (!paused && !vars.scrollTrigger) tl.play();
  return tl;
}

function createStaggered(
  target: Target | Target[],
  fromVars: Vars | null,
  toVars: Vars,
  mode: TweenMode,
): TimelineControls {
  const targets = resolveTargets(target);
  const stagger = toVars.stagger!;
  const baseDelay = toVars.delay ?? 0;
  const cleanTo = stripSpecial(toVars);
  const cleanFrom = fromVars ? stripSpecial(fromVars) : null;

  const tl = timeline({
    paused: !!toVars.scrollTrigger,
    onComplete: toVars.onComplete,
    onStart: toVars.onStart,
    onUpdate: toVars.onUpdate,
  });

  const { onComplete: _oc, onStart: _os, onUpdate: _ou, ...childBase } =
    cleanTo;

  for (let i = 0; i < targets.length; i++) {
    const start = baseDelay + resolveStaggerDelay(i, targets.length, stagger);
    const itemTo = mapFunctionValues(
      { ...childBase, delay: 0 },
      i,
      targets[i],
      targets,
    ) as Vars;

    if (mode === "to") {
      tl.to(targets[i], itemTo, start);
    } else if (mode === "from") {
      const itemFrom = mapFunctionValues(
        { ...childBase, delay: 0 },
        i,
        targets[i],
        targets,
      ) as Vars;
      tl.from(targets[i], itemFrom, start);
    } else {
      const itemFrom = mapFunctionValues(
        { ...(cleanFrom ?? {}), delay: 0 },
        i,
        targets[i],
        targets,
      ) as Vars;
      tl.fromTo(targets[i], itemFrom, itemTo, start);
    }
  }

  return tl;
}

export function to(
  target: Target | Target[],
  vars: Vars,
): TweenControls | TimelineControls {
  if (vars.keyframes) {
    const tl = createKeyframes(target, vars);
    return attachScrollTrigger(target, vars, tl);
  }
  const targets = resolveTargets(target);
  if (hasStagger(vars, targets.length)) {
    const tl = createStaggered(target, null, vars, "to");
    return attachScrollTrigger(target, vars, tl);
  }
  const tween = createTweenHandle(target, null, stripSpecial(vars), "to", {
    autoPlay: vars.scrollTrigger ? false : true,
  });
  return attachScrollTrigger(target, vars, tween);
}

export function from(
  target: Target | Target[],
  vars: Vars,
): TweenControls | TimelineControls {
  if (vars.keyframes) {
    // from + keyframes: treat as to with immediate start at first frame
    const tl = createKeyframes(target, vars);
    return attachScrollTrigger(target, vars, tl);
  }
  const targets = resolveTargets(target);
  if (hasStagger(vars, targets.length)) {
    const tl = createStaggered(target, vars, vars, "from");
    return attachScrollTrigger(target, vars, tl);
  }
  const cleaned = stripSpecial(vars);
  const tween = createTweenHandle(target, cleaned, cleaned, "from", {
    autoPlay: vars.scrollTrigger ? false : true,
  });
  return attachScrollTrigger(target, vars, tween);
}

export function fromTo(
  target: Target | Target[],
  fromVars: Vars,
  toVars: Vars,
): TweenControls | TimelineControls {
  if (toVars.keyframes) {
    const tl = createKeyframes(target, { ...toVars });
    return attachScrollTrigger(target, toVars, tl);
  }
  const targets = resolveTargets(target);
  if (hasStagger(toVars, targets.length) || hasStagger(fromVars, targets.length)) {
    const tl = createStaggered(
      target,
      fromVars,
      { ...toVars, stagger: toVars.stagger ?? fromVars.stagger },
      "fromTo",
    );
    return attachScrollTrigger(target, toVars, tl);
  }
  const tween = createTweenHandle(
    target,
    stripSpecial(fromVars),
    stripSpecial(toVars),
    "fromTo",
    { autoPlay: toVars.scrollTrigger || fromVars.scrollTrigger ? false : true },
  );
  return attachScrollTrigger(
    target,
    toVars.scrollTrigger ? toVars : fromVars,
    tween,
  );
}

export function set(
  target: Target | Target[],
  vars: Vars,
): TweenControls | TimelineControls {
  return to(target, { ...vars, duration: 0, ease: "none" });
}
