import type { TweenControls } from "./types";

const byId = new Map<string, TweenControls>();

export function registerId(id: string, tween: TweenControls): void {
  const prev = byId.get(id);
  if (prev && prev !== tween) prev.kill();
  byId.set(id, tween);
}

export function unregisterId(id: string, tween: TweenControls): void {
  if (byId.get(id) === tween) byId.delete(id);
}

export function getById(id: string): TweenControls | undefined {
  return byId.get(id);
}

/** Test helper */
export function _clearIds(): void {
  byId.clear();
}
