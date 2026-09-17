import { beforeEach, describe, expect, it } from "vitest";
import { quickTo } from "../src";
import { ticker } from "../src/ticker";

describe("quickTo", () => {
  beforeEach(() => {
    ticker._reset();
  });

  it("retargets the same property", () => {
    const target = { x: 0 };
    const setX = quickTo(target, "x", {
      duration: 1,
      ease: "none",
    });

    const a = setX(100);
    a.pause();
    a.seek(0.5);
    expect(target.x).toBeCloseTo(50, 5);

    const b = setX(0);
    expect(a.isActive()).toBe(false);
    b.pause();
    b.seek(0.5);
    // from ~50 toward 0
    expect(target.x).toBeCloseTo(25, 5);
  });
});
