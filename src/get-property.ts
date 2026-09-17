import {
  cssPropName,
  getTransformBag,
  isTransformProp,
  readObjectNumber,
  readStyleNumber,
} from "./prop";
import { resolveTargets } from "./tween";
import type { Target } from "./types";

/**
 * Read the current value of a property (transform bag, computed style, or object field).
 */
export function getProperty(
  target: Target,
  property: string,
): number | string {
  const resolved = resolveTargets(target)[0];
  if (!resolved) return 0;

  if (property === "autoAlpha") {
    if (typeof Element !== "undefined" && resolved instanceof Element) {
      return readStyleNumber(resolved, "opacity").num;
    }
    return readObjectNumber(resolved as object, "opacity");
  }

  if (
    typeof Element !== "undefined" &&
    resolved instanceof Element &&
    isTransformProp(property)
  ) {
    const bag = getTransformBag(resolved);
    if (property === "scale") return bag.scaleX;
    return (bag as unknown as Record<string, number>)[property] ?? 0;
  }

  if (typeof Element !== "undefined" && resolved instanceof Element) {
    if (property === "opacity") {
      return readStyleNumber(resolved, "opacity").num;
    }
    const el = resolved as HTMLElement;
    const css = cssPropName(property);
    const inline = el.style.getPropertyValue(css);
    if (inline) return inline;
    return getComputedStyle(el).getPropertyValue(css);
  }

  const value = (resolved as Record<string, unknown>)[property];
  if (typeof value === "number" || typeof value === "string") return value;
  return readObjectNumber(resolved as object, property);
}
