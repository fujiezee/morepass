import type { Vars } from "./types";

let globalDefaults: Partial<Vars> = {};

/** Merge into (or replace) global tween defaults. Pass `{}` to clear. */
export function defaults(vars?: Partial<Vars>): Partial<Vars> {
  if (vars === undefined) return { ...globalDefaults };
  if (Object.keys(vars).length === 0) {
    globalDefaults = {};
    return {};
  }
  globalDefaults = { ...globalDefaults, ...vars };
  return { ...globalDefaults };
}

export function mergeDefaults(vars: Vars): Vars {
  if (!Object.keys(globalDefaults).length) return vars;
  return { ...globalDefaults, ...vars };
}

/** Test helper */
export function _resetDefaults(): void {
  globalDefaults = {};
}
