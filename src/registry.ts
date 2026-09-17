import type { TweenControls } from "./types";

/** Soft registry: WeakMap target → live tweens; Set for global enumeration. */
const byTarget = new WeakMap<object, Set<TweenControls>>();
const live = new Set<TweenControls>();

export function registerTween(
  targets: object[],
  tween: TweenControls,
): void {
  live.add(tween);
  for (const target of targets) {
    let set = byTarget.get(target);
    if (!set) {
      set = new Set();
      byTarget.set(target, set);
    }
    set.add(tween);
  }
}

export function unregisterTween(
  targets: object[],
  tween: TweenControls,
): void {
  live.delete(tween);
  for (const target of targets) {
    const set = byTarget.get(target);
    if (!set) continue;
    set.delete(tween);
    if (set.size === 0) byTarget.delete(target);
  }
}

export function tweensOf(target: object): TweenControls[] {
  const set = byTarget.get(target);
  return set ? [...set] : [];
}

export function allLiveTweens(): TweenControls[] {
  return [...live];
}

/** Test helper */
export function _clearLiveRegistry(): void {
  live.clear();
}
