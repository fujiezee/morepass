import { to } from "./animate";
import type { EaseFn, EaseName, Target, TweenControls, Vars } from "./types";

export type QuickToVars = {
  duration?: number;
  ease?: EaseName | EaseFn;
  overwrite?: boolean | "auto";
};

/**
 * Returns a setter that kills the previous tween and animates the property
 * to a new value — handy for pointer / scrub-style updates.
 */
export function quickTo(
  target: Target | Target[],
  property: string,
  vars: QuickToVars = {},
): (value: number | string) => TweenControls {
  let current: TweenControls | null = null;
  const { duration = 0.4, ease = "power2.out", overwrite = true } = vars;

  return (value) => {
    current?.kill();
    const next: Vars = {
      [property]: value,
      duration,
      ease,
      overwrite,
    };
    current = to(target, next);
    return current;
  };
}
