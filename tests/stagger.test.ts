import { describe, expect, it, beforeEach } from "vitest";
import { resolveStaggerDelay, staggerRank } from "../src/stagger";
import { to, timeline } from "../src";
import { ticker } from "../src/ticker";

describe("stagger math", () => {
  it("spaces items by each", () => {
    expect(resolveStaggerDelay(0, 4, 0.1)).toBeCloseTo(0, 5);
    expect(resolveStaggerDelay(1, 4, 0.1)).toBeCloseTo(0.1, 5);
    expect(resolveStaggerDelay(3, 4, 0.1)).toBeCloseTo(0.3, 5);
  });

  it("supports from:end", () => {
    expect(resolveStaggerDelay(0, 4, { each: 0.1, from: "end" })).toBeCloseTo(
      0.3,
      5,
    );
    expect(resolveStaggerDelay(3, 4, { each: 0.1, from: "end" })).toBeCloseTo(
      0,
      5,
    );
  });

  it("supports amount distribution", () => {
    expect(resolveStaggerDelay(0, 5, { amount: 1 })).toBeCloseTo(0, 5);
    expect(resolveStaggerDelay(4, 5, { amount: 1 })).toBeCloseTo(1, 5);
    expect(resolveStaggerDelay(2, 5, { amount: 1 })).toBeCloseTo(0.5, 5);
  });

  it("ranks center from the middle", () => {
    expect(staggerRank(2, 5, "center")).toBeCloseTo(0, 5);
    expect(staggerRank(0, 5, "center")).toBeCloseTo(2, 5);
  });
});

describe("staggered tweens", () => {
  beforeEach(() => {
    ticker._reset();
  });

  it("to() with stagger returns a timeline of delayed children", () => {
    const a = { v: 0 };
    const b = { v: 0 };
    const c = { v: 0 };
    const anim = to([a, b, c], {
      v: 100,
      duration: 1,
      ease: "none",
      stagger: 0.5,
    });

    anim.pause();
    expect(anim.duration).toBeCloseTo(2, 5); // 0.5*2 + 1

    anim.seek(0.25);
    expect(a.v).toBeCloseTo(25, 5);
    expect(b.v).toBeCloseTo(0, 5);

    anim.seek(0.75);
    expect(a.v).toBeCloseTo(75, 5);
    expect(b.v).toBeCloseTo(25, 5);
    expect(c.v).toBeCloseTo(0, 5);
  });

  it("supports function values with index", () => {
    const items = [{ x: 0 }, { x: 0 }, { x: 0 }];
    const anim = to(items, {
      x: (i: number) => (i + 1) * 10,
      duration: 1,
      ease: "none",
      stagger: 0,
    });
    anim.pause();
    anim.seek(1);
    expect(items[0].x).toBeCloseTo(10, 5);
    expect(items[1].x).toBeCloseTo(20, 5);
    expect(items[2].x).toBeCloseTo(30, 5);
  });

  it("timeline.to supports stagger", () => {
    const items = [{ n: 0 }, { n: 0 }];
    const tl = timeline({ paused: true }).to(items, {
      n: 1,
      duration: 1,
      ease: "none",
      stagger: 0.5,
    });
    expect(tl.duration).toBeCloseTo(1.5, 5);
    tl.seek(0.5);
    expect(items[0].n).toBeCloseTo(0.5, 5);
    expect(items[1].n).toBeCloseTo(0, 5);
  });
});
