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

export const utils = {
  clamp,
  normalize,
  interpolate,
  mapRange,
  snap,
  random,
  pipe,
};
