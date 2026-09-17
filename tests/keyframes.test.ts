import { beforeEach, describe, expect, it } from "vitest";
import { to } from "../src";
import { ticker } from "../src/ticker";

describe("keyframes", () => {
  beforeEach(() => {
    ticker._reset();
  });

  it("runs array keyframes sequentially", () => {
    const target = { x: 0, y: 0 };
    const anim = to(target, {
      duration: 1,
      ease: "none",
      paused: true,
      keyframes: [{ x: 100 }, { x: 100, y: 50 }, { x: 0, y: 50 }],
    });

    expect(anim.duration).toBeCloseTo(3, 5);

    anim.seek(0.5);
    expect(target.x).toBeCloseTo(50, 5);
    expect(target.y).toBeCloseTo(0, 5);

    anim.seek(1.5);
    expect(target.x).toBeCloseTo(100, 5);
    expect(target.y).toBeCloseTo(25, 5);

    anim.seek(3);
    expect(target.x).toBeCloseTo(0, 5);
    expect(target.y).toBeCloseTo(50, 5);
  });

  it("supports percentage keyframes", () => {
    const target = { v: 0 };
    const anim = to(target, {
      duration: 2,
      ease: "none",
      paused: true,
      keyframes: {
        "0%": { v: 0 },
        "50%": { v: 100 },
        "100%": { v: 40 },
      },
    });
    anim.seek(1);
    expect(target.v).toBeCloseTo(100, 5);
    anim.seek(2);
    expect(target.v).toBeCloseTo(40, 5);
  });
});
