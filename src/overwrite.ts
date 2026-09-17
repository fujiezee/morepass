export interface PropOwner {
  killProps(keys: string[]): void;
  /** Full kill used when overwrite: true */
  killAll(): void;
}

type TargetMap = Map<string, PropOwner>;

const registry = new WeakMap<object, TargetMap>();

/** Aliases so scale / scaleX / scaleY overwrite each other correctly. */
export function expandPropKeys(keys: string[]): string[] {
  const out = new Set<string>();
  for (const key of keys) {
    out.add(key);
    if (key === "scale") {
      out.add("scaleX");
      out.add("scaleY");
    } else if (key === "scaleX" || key === "scaleY") {
      out.add("scale");
    }
  }
  return [...out];
}

export function claimProps(
  target: object,
  keys: string[],
  owner: PropOwner,
  mode: boolean | "auto",
) {
  if (mode === false || keys.length === 0) return;

  let map = registry.get(target);
  if (!map) {
    map = new Map();
    registry.set(target, map);
  }

  const expanded = expandPropKeys(keys);

  if (mode === true) {
    const others = new Set<PropOwner>();
    for (const prev of map.values()) {
      if (prev !== owner) others.add(prev);
    }
    for (const prev of others) prev.killAll();
  } else {
    // auto: only conflicting properties
    const byOwner = new Map<PropOwner, string[]>();
    for (const key of expanded) {
      const prev = map.get(key);
      if (prev && prev !== owner) {
        const list = byOwner.get(prev) ?? [];
        list.push(key);
        byOwner.set(prev, list);
      }
    }
    for (const [prev, conflictKeys] of byOwner) {
      prev.killProps(conflictKeys);
    }
  }

  for (const key of expanded) {
    map.set(key, owner);
  }
}

export function releaseProps(
  target: object,
  keys: string[],
  owner: PropOwner,
) {
  const map = registry.get(target);
  if (!map) return;
  for (const key of expandPropKeys(keys)) {
    if (map.get(key) === owner) map.delete(key);
  }
}

/** Test helper */
export function _clearOverwriteRegistry() {
  // WeakMap cannot be cleared; no-op for GC. Expose for API symmetry.
}
