import { beforeEach, describe, expect, it, vi } from "vitest";
import { timeline } from "../src";
import { ticker } from "../src/ticker";

describe("timeline", () => {
  beforeEach(() => {
    ticker._reset();
  });

  it("sequences tweens one after another", () => {
    const a = { v: 0 };
    const b = { v: 0 };
    const tl = timeline({ paused: true })
      .to(a, { v: 100, duration: 1, ease: "none" })
      .to(b, { v: 50, duration: 1, ease: "none" });

    expect(tl.duration).toBeCloseTo(2, 5);
    tl.seek(0.5);
    expect(a.v).toBeCloseTo(50, 5);
    expect(b.v).toBeCloseTo(0, 5);
    tl.seek(1.5);
    expect(a.v).toBeCloseTo(100, 5);
    expect(b.v).toBeCloseTo(25, 5);
  });

  it("supports relative offsets += and -=", () => {
    const a = { v: 0 };
    const b = { v: 0 };
    const tl = timeline({ paused: true })
      .to(a, { v: 100, duration: 1, ease: "none" })
      .to(b, { v: 100, duration: 1, ease: "none" }, "-=0.5");

    expect(tl.duration).toBeCloseTo(1.5, 5);
    tl.seek(0.75);
    expect(a.v).toBeCloseTo(75, 5);
    expect(b.v).toBeCloseTo(25, 5);
  });

  it("supports < to align with previous start", () => {
    const a = { v: 0 };
    const b = { v: 0 };
    const tl = timeline({ paused: true })
      .to(a, { v: 100, duration: 1, ease: "none" })
      .to(b, { v: 100, duration: 1, ease: "none" }, "<");

    expect(tl.duration).toBeCloseTo(1, 5);
    tl.seek(0.5);
    expect(a.v).toBeCloseTo(50, 5);
    expect(b.v).toBeCloseTo(50, 5);
  });

  it("supports labels", () => {
    const a = { v: 0 };
    const tl = timeline({ paused: true })
      .addLabel("hit", 0.5)
      .to(a, { v: 100, duration: 1, ease: "none" }, "hit");

    tl.seek(1);
    expect(a.v).toBeCloseTo(50, 5);
    expect(tl.duration).toBeCloseTo(1.5, 5);
  });

  it("fires call() callbacks when reached", () => {
    const fn = vi.fn();
    const a = { v: 0 };
    const tl = timeline({ paused: true })
      .to(a, { v: 1, duration: 1, ease: "none" })
      .call(fn);

    tl.seek(0.9);
    expect(fn).not.toHaveBeenCalled();
    tl.seek(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("defaults cascade into child tweens", () => {
    const a = { v: 0 };
    const tl = timeline({
      paused: true,
      defaults: { duration: 2, ease: "none" },
    }).to(a, { v: 100 });

    expect(tl.duration).toBeCloseTo(2, 5);
    tl.seek(1);
    expect(a.v).toBeCloseTo(50, 5);
  });
});
