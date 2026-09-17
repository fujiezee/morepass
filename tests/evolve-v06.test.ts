import { beforeEach, describe, expect, it } from "vitest";
import { getById, to } from "../src";
import { buildStaggerDelays } from "../src/stagger";
import { ticker } from "../src/ticker";
import { _clearIds } from "../src/ids";

describe("evolve v0.6", () => {
  beforeEach(() => {
    ticker._reset();
    _clearIds();
  });

  it("resolves relative += values from current", () => {
    const t = { x: 10 };
    const tw = to(t, { x: "+=40", duration: 1, ease: "none", paused: true });
    tw.seek(1);
    expect(t.x).toBeCloseTo(50, 5);
  });

  it("supports xPercent on elements", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const tw = to(el, {
      xPercent: 50,
      duration: 1,
      ease: "none",
      paused: true,
    });
    tw.seek(1);
    expect(el.style.transform).toContain("50%");
    el.remove();
  });

  it("sets transformOrigin at start", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const tw = to(el, {
      rotation: 45,
      transformOrigin: "0% 0%",
      duration: 1,
      ease: "none",
      paused: true,
    });
    tw.seek(0.01);
    expect(el.style.transformOrigin).toBe("0% 0%");
    el.remove();
  });

  it("getById finds tween by id", () => {
    const t = { n: 0 };
    const tw = to(t, { n: 1, duration: 1, id: "pulse", paused: true });
    expect(getById("pulse")).toBe(tw);
    tw.kill();
    expect(getById("pulse")).toBeUndefined();
  });

  it("stagger from random returns per-index delays", () => {
    const delays = buildStaggerDelays(5, { each: 0.1, from: "random" });
    expect(delays).toHaveLength(5);
    expect(delays.every((d) => d >= 0)).toBe(true);
    const unique = new Set(delays);
    // with each:0.1 ranks 0..4 → delays 0,0.1,0.2,0.3,0.4 all distinct
    expect(unique.size).toBe(5);
  });
});
