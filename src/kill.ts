import { resolveTargets } from "./tween";
import { tweensOf } from "./registry";
import type { Target, TweenControls } from "./types";

export function killTweensOf(
  target: Target | Target[],
  props?: string | string[],
): void {
  const targets = resolveTargets(target);
  const keys = props
    ? new Set(Array.isArray(props) ? props : [props])
    : null;

  for (const item of targets) {
    for (const tw of tweensOf(item)) {
      if (!keys) {
        tw.kill();
        continue;
      }
      const handle = tw as TweenControls & {
        killProps?(keys: string[]): void;
      };
      if (typeof handle.killProps === "function") {
        handle.killProps([...keys]);
      } else {
        tw.kill();
      }
    }
  }
}

export function isTweening(target: Target | Target[]): boolean {
  const targets = resolveTargets(target);
  for (const item of targets) {
    for (const tw of tweensOf(item)) {
      if (tw.isActive()) return true;
    }
  }
  return false;
}
