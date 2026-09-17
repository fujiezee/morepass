import { to } from "./animate";
import type { TweenControls, Vars } from "./types";

/**
 * Fire `callback` after `delay` seconds. Returns a tween you can pause/kill.
 */
export function delayedCall(
  delay: number,
  callback: () => void,
  vars: Omit<Vars, "duration" | "ease" | "onComplete"> = {},
): TweenControls {
  return to(
    {},
    {
      ...vars,
      duration: Math.max(0, delay),
      ease: "none",
      onComplete: callback,
    },
  );
}
