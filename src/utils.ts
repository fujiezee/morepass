export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

export function normalize(min: number, max: number, value: number): number {
  if (max === min) return 0;
  return clamp((value - min) / (max - min), 0, 1);
}

export function interpolate(start: number, end: number, progress: number): number {
  return start + (end - start) * progress;
}

export function mapRange(
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
  value: number,
): number {
  return interpolate(outMin, outMax, normalize(inMin, inMax, value));
}

export function snap(increment: number | number[], value: number): number {
  if (Array.isArray(increment)) {
    let best = increment[0] ?? value;
    let bestDist = Math.abs(value - best);
    for (const n of increment) {
      const d = Math.abs(value - n);
      if (d < bestDist) {
        best = n;
        bestDist = d;
      }
    }
    return best;
  }
  if (increment === 0) return value;
  return Math.round(value / increment) * increment;
}

export function random(
  minOrArray: number | unknown[],
  max?: number,
  snapTo = 1,
): number | unknown {
  if (Array.isArray(minOrArray)) {
    const list = minOrArray;
    if (list.length === 0) return undefined;
    return list[Math.floor(Math.random() * list.length)];
  }
  const min = minOrArray;
  const hi = max ?? min;
  const lo = Math.min(min, hi);
  const top = Math.max(min, hi);
  const n = lo + Math.random() * (top - lo);
  return snapTo ? snap(snapTo, n) : n;
}

export function pipe<T>(...fns: Array<(v: T) => T>): (v: T) => T {
  return (value: T) => fns.reduce((acc, fn) => fn(acc), value);
}

/** Wrap a value into [min, max) range (or index into an array). */
export function wrap(min: number, max: number, value: number): number;
export function wrap<T>(array: T[], index: number): T;
export function wrap(
  minOrArray: number | unknown[],
  maxOrIndex: number,
  value?: number,
): number | unknown {
  if (Array.isArray(minOrArray)) {
    const list = minOrArray;
    if (list.length === 0) return undefined;
    const i = ((maxOrIndex % list.length) + list.length) % list.length;
    return list[i];
  }
  const min = minOrArray;
  const max = maxOrIndex;
  const v = value ?? 0;
  const range = max - min;
  if (range === 0) return min;
  return ((((v - min) % range) + range) % range) + min;
}

export type DistributeConfig = {
  base?: number;
  amount?: number;
  from?: number | "start" | "center" | "end" | "edges";
};

/** Return a stagger-style distributor for function values / manual offsets. */
export function distribute(
  config: DistributeConfig | number = {},
): (i: number, _target?: unknown, targets?: unknown[]) => number {
  const cfg: DistributeConfig =
    typeof config === "number" ? { amount: config } : config;
  const base = cfg.base ?? 0;
  const amount = cfg.amount ?? 1;
  const from = cfg.from ?? "start";

  return (i, _target, targets) => {
    const total = Math.max(1, targets?.length ?? 1);
    let ratio: number;
    if (typeof from === "number") {
      const dist = Math.abs(i - from);
      const maxDist = Math.max(from, total - 1 - from) || 1;
      ratio = dist / maxDist;
    } else if (from === "end") {
      ratio = total === 1 ? 0 : (total - 1 - i) / (total - 1);
    } else if (from === "center") {
      const mid = (total - 1) / 2;
      const dist = Math.abs(i - mid);
      ratio = mid === 0 ? 0 : dist / mid;
    } else if (from === "edges") {
      const mid = (total - 1) / 2;
      const dist = Math.abs(i - mid);
      ratio = mid === 0 ? 0 : 1 - dist / mid;
    } else {
      ratio = total === 1 ? 0 : i / (total - 1);
    }
    return base + amount * ratio;
  };
}

export const utils = {
  clamp,
  normalize,
  interpolate,
  mapRange,
  snap,
  random,
  pipe,
  wrap,
  distribute,
};
