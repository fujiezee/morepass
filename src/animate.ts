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
  const { stagger: _s, scrollTrigger: _st, ...rest } = vars;
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
      (t): t is Element => typeof Element !== "undefined" && t instanceof Element,
    );
    if (first) stVars.trigger = first;
  }

  createScrollTrigger(stVars);
  return animation;
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
  return attachScrollTrigger(target, toVars.scrollTrigger ? toVars : fromVars, tween);
}

export function set(
  target: Target | Target[],
  vars: Vars,
): TweenControls | TimelineControls {
  return to(target, { ...vars, duration: 0, ease: "none" });
}
