import type { TweenControls } from "./types";

export interface Context {
  /** Add an animation so revert/kill can clean it up. */
  add<T extends TweenControls>(animation: T): T;
  /** Ignore animations created inside the callback (do not collect). */
  ignore<T>(fn: () => T): T;
  /** Kill every collected animation. */
  revert(): void;
  kill(): void;
  readonly animations: readonly TweenControls[];
}

const stack: ContextImpl[] = [];

class ContextImpl implements Context {
  private readonly list: TweenControls[] = [];
  private ignoring = 0;

  get animations() {
    return this.list;
  }

  add<T extends TweenControls>(animation: T): T {
    if (this.ignoring === 0) this.list.push(animation);
    return animation;
  }

  ignore<T>(fn: () => T): T {
    this.ignoring++;
    try {
      return fn();
    } finally {
      this.ignoring--;
    }
  }

  revert() {
    for (const tw of this.list) tw.kill();
    this.list.length = 0;
  }

  kill() {
    this.revert();
  }
}

/** Collect tweens created while `fn` runs; return a handle to revert them. */
export function context(fn?: (self: Context) => void): Context {
  const ctx = new ContextImpl();
  stack.push(ctx);
  try {
    fn?.(ctx);
  } finally {
    stack.pop();
  }
  return ctx;
}

export function currentContext(): ContextImpl | null {
  return stack.length ? stack[stack.length - 1]! : null;
}

export function collectIntoContext(animation: TweenControls): void {
  const ctx = currentContext();
  if (ctx) ctx.add(animation);
}
