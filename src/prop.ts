export type PropKind = "transform" | "style" | "object" | "attr";
export type ValueType = "number" | "color";

export interface ParsedProp {
  key: string;
  kind: PropKind;
  valueType: ValueType;
  start: number;
  end: number;
  unit: string;
  startColor?: import("./color").RGBA;
  endColor?: import("./color").RGBA;
  active: boolean;
}

export interface TransformBag {
  x: number;
  y: number;
  z: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  rotationX: number;
  rotationY: number;
  skewX: number;
  skewY: number;
}

const TRANSFORM_PROPS = new Set([
  "x",
  "y",
  "z",
  "scale",
  "scaleX",
  "scaleY",
  "rotation",
  "rotationX",
  "rotationY",
  "skewX",
  "skewY",
]);

const UNIT_DEFAULTS: Record<string, string> = {
  x: "px",
  y: "px",
  z: "px",
  rotation: "deg",
  rotationX: "deg",
  rotationY: "deg",
  skewX: "deg",
  skewY: "deg",
};

const transformCache = new WeakMap<object, TransformBag>();

export function isTransformProp(key: string): boolean {
  return TRANSFORM_PROPS.has(key);
}

export function defaultTransform(): TransformBag {
  return {
    x: 0,
    y: 0,
    z: 0,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    rotationX: 0,
    rotationY: 0,
    skewX: 0,
    skewY: 0,
  };
}

/** Shared per-target transform bag so overlapping tweens don't clobber each other. */
export function getTransformBag(target: object): TransformBag {
  let bag = transformCache.get(target);
  if (!bag) {
    bag = defaultTransform();
    transformCache.set(target, bag);
  }
  return bag;
}

const VALUE_RE = /^([+-]?\d*\.?\d+)([a-z%]*)$/i;

export function parseNumeric(
  value: unknown,
  fallbackUnit = "",
): { num: number; unit: string } | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return { num: value, unit: fallbackUnit };
  }
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  const match = VALUE_RE.exec(trimmed);
  if (!match) return null;
  return { num: parseFloat(match[1]), unit: match[2] || fallbackUnit };
}

export function readStyleNumber(
  el: Element,
  key: string,
): { num: number; unit: string } {
  if (!(el instanceof HTMLElement) && !(el instanceof SVGElement)) {
    return { num: 0, unit: "" };
  }

  if (key === "opacity") {
    const raw = getComputedStyle(el).opacity;
    return { num: raw === "" ? 1 : parseFloat(raw), unit: "" };
  }

  const cssKey = key.includes("-")
    ? key
    : key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
  const raw = getComputedStyle(el).getPropertyValue(cssKey) || "";
  const parsed = parseNumeric(raw);
  if (parsed) return parsed;

  if (
    key === "width" ||
    key === "height" ||
    key === "top" ||
    key === "left" ||
    key === "right" ||
    key === "bottom" ||
    key === "margin" ||
    key === "padding" ||
    key.startsWith("margin") ||
    key.startsWith("padding")
  ) {
    return { num: 0, unit: "px" };
  }

  return { num: 0, unit: "" };
}

export function readObjectNumber(target: object, key: string): number {
  const value = (target as Record<string, unknown>)[key];
  if (typeof value === "number") return value;
  const parsed = parseNumeric(value);
  return parsed?.num ?? 0;
}

export function composeTransform(bag: TransformBag): string {
  const parts: string[] = [];
  if (bag.x || bag.y || bag.z) {
    parts.push(`translate3d(${bag.x}px, ${bag.y}px, ${bag.z}px)`);
  }
  if (bag.rotation) parts.push(`rotate(${bag.rotation}deg)`);
  if (bag.rotationX) parts.push(`rotateX(${bag.rotationX}deg)`);
  if (bag.rotationY) parts.push(`rotateY(${bag.rotationY}deg)`);
  if (bag.skewX) parts.push(`skewX(${bag.skewX}deg)`);
  if (bag.skewY) parts.push(`skewY(${bag.skewY}deg)`);
  if (bag.scaleX !== 1 || bag.scaleY !== 1) {
    parts.push(`scale(${bag.scaleX}, ${bag.scaleY})`);
  }
  return parts.join(" ") || "none";
}

export function applyTransformProp(
  bag: TransformBag,
  key: string,
  value: number,
) {
  if (key === "scale") {
    bag.scaleX = value;
    bag.scaleY = value;
    return;
  }
  if (key in bag) {
    (bag as unknown as Record<string, number>)[key] = value;
  }
}

export function unitFor(key: string, provided: string): string {
  if (provided) return provided;
  return UNIT_DEFAULTS[key] ?? "";
}

export function formatValue(num: number, unit: string): string {
  return unit ? `${num}${unit}` : String(num);
}

export function cssPropName(key: string): string {
  if (key.startsWith("--")) return key;
  return key.includes("-")
    ? key
    : key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

export function readAttrNumber(el: Element, key: string): number {
  const raw = el.getAttribute(key);
  if (raw == null || raw === "") return 0;
  const parsed = parseNumeric(raw);
    return parsed?.num ?? (Number(raw) || 0);
  }
