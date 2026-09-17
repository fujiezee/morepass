type Cleanup = void | (() => void);

export type MatchMediaConditions = Record<
  string,
  (context: { matches: boolean; condition: string }) => Cleanup
>;

interface QueryEntry {
  mql: MediaQueryList;
  handler: (event?: MediaQueryListEvent) => void;
  cleanup: Cleanup;
  factory: MatchMediaConditions[string];
  condition: string;
}

export interface MatchMediaHandle {
  add(conditions: MatchMediaConditions): MatchMediaHandle;
  revert(): void;
  kill(): void;
}

class MatchMedia implements MatchMediaHandle {
  private entries: QueryEntry[] = [];
  private killed = false;

  add(conditions: MatchMediaConditions): this {
    if (this.killed || typeof window === "undefined") return this;

    for (const [condition, factory] of Object.entries(conditions)) {
      const mql = window.matchMedia(condition);
      const entry: QueryEntry = {
        mql,
        factory,
        condition,
        cleanup: undefined,
        handler: () => {
          // revert previous
          if (typeof entry.cleanup === "function") entry.cleanup();
          entry.cleanup = undefined;
          if (entry.mql.matches) {
            entry.cleanup = factory({
              matches: true,
              condition: entry.condition,
            });
          }
        },
      };
      entry.handler();
      mql.addEventListener("change", entry.handler);
      this.entries.push(entry);
    }
    return this;
  }

  revert() {
    for (const entry of this.entries) {
      if (typeof entry.cleanup === "function") entry.cleanup();
      entry.cleanup = undefined;
    }
  }

  kill() {
    this.revert();
    for (const entry of this.entries) {
      entry.mql.removeEventListener("change", entry.handler);
    }
    this.entries = [];
    this.killed = true;
  }
}

export function matchMedia(
  conditions?: MatchMediaConditions,
): MatchMediaHandle {
  const mm = new MatchMedia();
  if (conditions) mm.add(conditions);
  return mm;
}
