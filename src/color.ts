export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

const HEX_RE = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const RGB_RE =
  /^rgba?\(\s*([+-]?\d*\.?\d+%?)\s*,\s*([+-]?\d*\.?\d+%?)\s*,\s*([+-]?\d*\.?\d+%?)\s*(?:,\s*([+-]?\d*\.?\d+%?))?\s*\)$/i;

const NAMED: Record<string, string> = {
  transparent: "rgba(0,0,0,0)",
  black: "#000000",
  white: "#ffffff",
  red: "#ff0000",
  green: "#008000",
  blue: "#0000ff",
  yellow: "#ffff00",
  orange: "#ffa500",
  purple: "#800080",
  pink: "#ffc0cb",
  gray: "#808080",
  grey: "#808080",
  cyan: "#00ffff",
  magenta: "#ff00ff",
};

function channel(raw: string): number {
  if (raw.endsWith("%")) return (parseFloat(raw) / 100) * 255;
  return parseFloat(raw);
}

function alpha(raw: string | undefined): number {
  if (raw === undefined) return 1;
  if (raw.endsWith("%")) return parseFloat(raw) / 100;
  return parseFloat(raw);
}

function fromHex(hex: string): RGBA | null {
  const m = HEX_RE.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3 || h.length === 4) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
  return { r, g, b, a };
}

function fromRgb(input: string): RGBA | null {
  const m = RGB_RE.exec(input.trim());
  if (!m) return null;
  return {
    r: channel(m[1]),
    g: channel(m[2]),
    b: channel(m[3]),
    a: alpha(m[4]),
  };
}

let probe: HTMLElement | null = null;

function fromBrowser(input: string): RGBA | null {
  if (typeof document === "undefined") return null;
  try {
    probe ??= document.createElement("div");
    probe.style.color = "";
    probe.style.color = input;
    // Must be in DOM for some engines; append briefly
    const parent = document.body ?? document.documentElement;
    const hadParent = probe.isConnected;
    if (!hadParent) parent.appendChild(probe);
    const computed = getComputedStyle(probe).color;
    if (!hadParent) parent.removeChild(probe);
    return fromRgb(computed);
  } catch {
    return null;
  }
}

export function parseColor(value: unknown): RGBA | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const named = NAMED[trimmed.toLowerCase()];
  if (named) return parseColor(named);

  return fromHex(trimmed) ?? fromRgb(trimmed) ?? fromBrowser(trimmed);
}

export function mixColor(a: RGBA, b: RGBA, t: number): RGBA {
  return {
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
    a: a.a + (b.a - a.a) * t,
  };
}

export function formatColor(c: RGBA): string {
  const r = Math.round(c.r);
  const g = Math.round(c.g);
  const b = Math.round(c.b);
  if (c.a >= 0.999) return `rgb(${r}, ${g}, ${b})`;
  const a = Math.round(c.a * 1000) / 1000;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export function isColorProp(key: string): boolean {
  const k = key.toLowerCase();
  return (
    k === "color" ||
    k === "background" ||
    k === "backgroundcolor" ||
    k === "bordercolor" ||
    k === "outlinecolor" ||
    k === "fill" ||
    k === "stroke" ||
    k === "textfillcolor" ||
    k.endsWith("color")
  );
}

export function readStyleColor(el: Element, key: string): RGBA {
  if (!(el instanceof HTMLElement) && !(el instanceof SVGElement)) {
    return { r: 0, g: 0, b: 0, a: 1 };
  }
  const cssKey = key.includes("-")
    ? key
    : key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
  const raw =
    getComputedStyle(el).getPropertyValue(cssKey) ||
    (key === "backgroundColor"
      ? getComputedStyle(el).backgroundColor
      : getComputedStyle(el).color);
  return parseColor(raw) ?? { r: 0, g: 0, b: 0, a: 1 };
}
