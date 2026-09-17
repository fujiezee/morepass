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

function stripStagger(vars: Vars): Vars {
  const { stagger: _s, ...rest } = vars;
  return rest;
}

function hasStagger(vars: Vars, targetCount: number): boolean {
  return vars.stagger != null && targetCount > 1;
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
  const cleanTo = stripStagger(toVars);
  const cleanFrom = fromVars ? stripStagger(fromVars) : null;

  const tl = timeline({
    onComplete: toVars.onComplete,
    onStart: toVars.onStart,
    onUpdate: toVars.onUpdate,
  });

  // Avoid firing parent callbacks on every child — strip from children
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
    return createStaggered(target, null, vars, "to");
  }
  return createTweenHandle(target, null, vars, "to");
}

export function from(
  target: Target | Target[],
  vars: Vars,
): TweenControls | TimelineControls {
  const targets = resolveTargets(target);
  if (hasStagger(vars, targets.length)) {
    return createStaggered(target, vars, vars, "from");
  }
  return createTweenHandle(target, vars, vars, "from");
}

export function fromTo(
  target: Target | Target[],
  fromVars: Vars,
  toVars: Vars,
): TweenControls | TimelineControls {
  const targets = resolveTargets(target);
  if (hasStagger(toVars, targets.length) || hasStagger(fromVars, targets.length)) {
    return createStaggered(
      target,
      fromVars,
      { ...toVars, stagger: toVars.stagger ?? fromVars.stagger },
      "fromTo",
    );
  }
  return createTweenHandle(target, fromVars, toVars, "fromTo");
}

export function set(
  target: Target | Target[],
  vars: Vars,
): TweenControls | TimelineControls {
  return to(target, { ...vars, duration: 0, ease: "none" });
}
