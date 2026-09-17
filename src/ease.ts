import type { EaseFn, EaseName } from "./types";

const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);

const power =
  (p: number, type: "in" | "out" | "inOut"): EaseFn =>
  (t) => {
    t = clamp01(t);
    if (type === "in") return t ** p;
    if (type === "out") return 1 - (1 - t) ** p;
    return t < 0.5 ? (2 * t) ** p / 2 : 1 - ((-2 * t + 2) ** p) / 2;
  };

const sineIn: EaseFn = (t) => 1 - Math.cos((clamp01(t) * Math.PI) / 2);
const sineOut: EaseFn = (t) => Math.sin((clamp01(t) * Math.PI) / 2);
const sineInOut: EaseFn = (t) => -(Math.cos(Math.PI * clamp01(t)) - 1) / 2;

const expoIn: EaseFn = (t) => {
  t = clamp01(t);
  return t === 0 ? 0 : 2 ** (10 * t - 10);
};
const expoOut: EaseFn = (t) => {
  t = clamp01(t);
  return t === 1 ? 1 : 1 - 2 ** (-10 * t);
};
const expoInOut: EaseFn = (t) => {
  t = clamp01(t);
  if (t === 0) return 0;
  if (t === 1) return 1;
  return t < 0.5 ? 2 ** (20 * t - 10) / 2 : (2 - 2 ** (-20 * t + 10)) / 2;
};

const circIn: EaseFn = (t) => 1 - Math.sqrt(1 - clamp01(t) ** 2);
const circOut: EaseFn = (t) => Math.sqrt(1 - (clamp01(t) - 1) ** 2);
const circInOut: EaseFn = (t) => {
  t = clamp01(t);
  return t < 0.5
    ? (1 - Math.sqrt(1 - (2 * t) ** 2)) / 2
    : (Math.sqrt(1 - (-2 * t + 2) ** 2) + 1) / 2;
};

const c1 = 1.70158;
const c2 = c1 * 1.525;
const c3 = c1 + 1;

const backIn: EaseFn = (t) => {
  t = clamp01(t);
  return c3 * t * t * t - c1 * t * t;
};
const backOut: EaseFn = (t) => {
  t = clamp01(t);
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
};
const backInOut: EaseFn = (t) => {
  t = clamp01(t);
  return t < 0.5
    ? ((2 * t) ** 2 * ((c2 + 1) * 2 * t - c2)) / 2
    : ((2 * t - 2) ** 2 * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
};

const elasticOut: EaseFn = (t) => {
  t = clamp01(t);
  if (t === 0 || t === 1) return t;
  return 2 ** (-10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
};

const bounceOut: EaseFn = (t) => {
  t = clamp01(t);
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
  if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
  return n1 * (t -= 2.625 / d1) * t + 0.984375;
};

const easings: Record<EaseName, EaseFn> = {
  none: (t) => clamp01(t),
  linear: (t) => clamp01(t),
  "power1.in": power(1, "in"),
  "power1.out": power(1, "out"),
  "power1.inOut": power(1, "inOut"),
  "power2.in": power(2, "in"),
  "power2.out": power(2, "out"),
  "power2.inOut": power(2, "inOut"),
  "power3.in": power(3, "in"),
  "power3.out": power(3, "out"),
  "power3.inOut": power(3, "inOut"),
  "sine.in": sineIn,
  "sine.out": sineOut,
  "sine.inOut": sineInOut,
  "expo.in": expoIn,
  "expo.out": expoOut,
  "expo.inOut": expoInOut,
  "circ.in": circIn,
  "circ.out": circOut,
  "circ.inOut": circInOut,
  "back.in": backIn,
  "back.out": backOut,
  "back.inOut": backInOut,
  "elastic.out": elasticOut,
  "bounce.out": bounceOut,
};

export function resolveEase(ease: EaseName | EaseFn | undefined): EaseFn {
  if (!ease) return easings["power1.out"];
  if (typeof ease === "function") return ease;
  return easings[ease] ?? easings["power1.out"];
}

export const ease = easings;
