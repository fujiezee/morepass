import type { StaggerFrom, StaggerVars } from "./types";

export function normalizeStagger(
  stagger: number | StaggerVars,
): Required<Pick<StaggerVars, "each" | "from">> & StaggerVars {
  if (typeof stagger === "number") {
    return { each: stagger, from: "start" };
  }
  return {
    each: stagger.each ?? 0,
    amount: stagger.amount,
    from: stagger.from ?? "start",
  };
}

/** Distance-from-origin index used to compute stagger delay. */
export function staggerRank(
  index: number,
  total: number,
  from: StaggerFrom = "start",
): number {
  if (total <= 1) return 0;

  if (from === "end") return total - 1 - index;
  if (from === "center") return Math.abs(index - (total - 1) / 2);
  if (from === "edges") {
    const center = (total - 1) / 2;
    return center - Math.abs(index - center);
  }
  if (typeof from === "number") return Math.abs(index - from);
  return index;
}

export function resolveStaggerDelay(
  index: number,
  total: number,
  stagger: number | StaggerVars,
): number {
  if (total <= 1) return 0;
  const cfg = normalizeStagger(stagger);
  const rank = staggerRank(index, total, cfg.from);

  if (cfg.amount != null) {
    const maxRank =
      cfg.from === "center" || cfg.from === "edges" || typeof cfg.from === "number"
        ? Math.max(
            ...Array.from({ length: total }, (_, i) =>
              staggerRank(i, total, cfg.from),
            ),
          )
        : total - 1;
    if (maxRank <= 0) return 0;
    return (rank / maxRank) * cfg.amount;
  }

  return rank * (cfg.each ?? 0);
}

export function mapFunctionValues(
  vars: Record<string, unknown>,
  index: number,
  target: object,
  targets: object[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(vars)) {
    if (typeof value === "function" && key !== "ease") {
      out[key] = (value as (i: number, t: object, all: object[]) => unknown)(
        index,
        target,
        targets,
      );
    } else {
      out[key] = value;
    }
  }
  return out;
}
