import { beforeEach, describe, expect, it, vi } from "vitest";
import { timeline, to } from "../src";
import { makeSteps, resolveEase } from "../src/ease";
import { buildStaggerDelays, staggerRank } from "../src/stagger";
import { ticker } from "../src/ticker";
import { _clearIds } from "../src/ids";

describe("evolve v0.9", () => {
  beforeEach(() => {
    ticker._reset();
    _clearIds();
  });

  it("animates clipPath inset(...) by interpolating numbers", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const tw = to(el, {
      clipPath: "inset(10% 20% 30% 40%)",
      duration: 1,
      ease: "none",
      paused: true,
    });
    tw.seek(0);
    expect(el.style.clipPath).toMatch(/inset\(0% 0% 0% 0%\)/);
    tw.seek(0.5);
    expect(el.style.clipPath).toMatch(/inset\(5% 10% 15% 20%\)/);
    tw.seek(1);
    expect(el.style.clipPath).toBe("inset(10% 20% 30% 40%)");
    el.remove();
  });

  it("animates clipPath circle(...) preserving template", () => {
    const el = document.createElement("div");
    el.style.clipPath = "circle(10% at 50% 50%)";
    document.body.appendChild(el);
    const tw = to(el, {
      clipPath: "circle(50% at 50% 50%)",
      duration: 1,
      ease: "none",
      paused: true,
    });
    tw.seek(0);
    expect(el.style.clipPath).toMatch(/circle\(10% at 50% 50%\)/);
    tw.seek(0.5);
    expect(el.style.clipPath).toMatch(/circle\(30% at 50% 50%\)/);
    tw.seek(1);
    expect(el.style.clipPath).toBe("circle(50% at 50% 50%)");
    el.remove();
  });

  it("stagger.axis x ranks by column with grid", () => {
    // 3x2: indices 0 1 2 / 3 4 5 — axis x from start → col
    expect(staggerRank(0, 6, "start", [3, 2], "x")).toBe(0);
    expect(staggerRank(1, 6, "start", [3, 2], "x")).toBe(1);
    expect(staggerRank(3, 6, "start", [3, 2], "x")).toBe(0);
    expect(staggerRank(5, 6, "start", [3, 2], "x")).toBe(2);

    const delays = buildStaggerDelays(6, {
      each: 0.1,
      from: "end",
      grid: [3, 2],
      axis: "x",
    });
    // end column first
    expect(delays[2]).toBeCloseTo(0, 5);
    expect(delays[5]).toBeCloseTo(0, 5);
    expect(delays[0]).toBeGreaterThan(delays[2]!);
  });

  it("stagger.axis y ranks by row with grid", () => {
    expect(staggerRank(0, 6, "start", [3, 2], "y")).toBe(0);
    expect(staggerRank(3, 6, "start", [3, 2], "y")).toBe(1);
    expect(staggerRank(1, 6, "start", [3, 2], "y")).toBe(0);

    const delays = buildStaggerDelays(6, {
      each: 0.1,
      from: "center",
      grid: [3, 2],
      axis: "y",
    });
    // both rows equally far from center of 2 rows → same rank for all in a row
    expect(delays[0]).toBeCloseTo(delays[1]!, 5);
    expect(delays[0]).toBeCloseTo(delays[3]!, 5);
  });

  it("resolves elastic.in / bounce.inOut and steps(n)", () => {
    const elasticIn = resolveEase("elastic.in");
    expect(elasticIn(0)).toBeCloseTo(0, 5);
    expect(elasticIn(1)).toBeCloseTo(1, 5);
    expect(elasticIn(0.2)).toBeLessThan(0);

    const bounceInOut = resolveEase("bounce.inOut");
    expect(bounceInOut(0)).toBeCloseTo(0, 5);
    expect(bounceInOut(1)).toBeCloseTo(1, 5);
    expect(bounceInOut(0.5)).toBeCloseTo(0.5, 2);

    const steps6 = resolveEase("steps(6)");
    expect(steps6(0)).toBe(0);
    expect(steps6(0.1)).toBeCloseTo(0, 5);
    expect(steps6(0.2)).toBeCloseTo(1 / 6, 5);
    expect(steps6(1)).toBe(1);

    const jumpStart = makeSteps(4, "jump-start");
    expect(jumpStart(0.01)).toBeCloseTo(0.25, 5);

    const jumpEnd = resolveEase("steps(4, jump-end)");
    expect(jumpEnd(0.24)).toBeCloseTo(0, 5);
    expect(jumpEnd(0.25)).toBeCloseTo(0.25, 5);
  });

  it("onOverwrite fires once on auto overwrite, distinct from onInterrupt", () => {
    const overwrite = vi.fn();
    const interrupt = vi.fn();
    const t = { x: 0, y: 0 };
    const first = to(t, {
      x: 100,
      y: 50,
      duration: 2,
      ease: "none",
      paused: true,
      onOverwrite: overwrite,
      onInterrupt: interrupt,
    });
    first.seek(0.2);
    to(t, {
      x: 20,
      duration: 0.5,
      ease: "none",
      overwrite: "auto",
      paused: true,
    }).seek(0);
    expect(overwrite).toHaveBeenCalledTimes(1);
    expect(interrupt).not.toHaveBeenCalled();
  });

  it("onOverwrite and onInterrupt both fire on overwrite:true", () => {
    const overwrite = vi.fn();
    const interrupt = vi.fn();
    const t = { x: 0 };
    to(t, {
      x: 100,
      duration: 2,
      ease: "none",
      paused: true,
      onOverwrite: overwrite,
      onInterrupt: interrupt,
    }).seek(0.1);
    to(t, {
      x: 10,
      duration: 0.3,
      ease: "none",
      overwrite: true,
      paused: true,
    }).seek(0);
    expect(overwrite).toHaveBeenCalledTimes(1);
    expect(interrupt).toHaveBeenCalledTimes(1);
  });

  it("explicit kill fires onInterrupt but not onOverwrite", () => {
    const overwrite = vi.fn();
    const interrupt = vi.fn();
    const t = { x: 0 };
    const tw = to(t, {
      x: 100,
      duration: 1,
      ease: "none",
      paused: true,
      onOverwrite: overwrite,
      onInterrupt: interrupt,
    });
    tw.seek(0.3);
    tw.kill();
    expect(interrupt).toHaveBeenCalledTimes(1);
    expect(overwrite).not.toHaveBeenCalled();
  });

  it("stores and updates vars.data on tween and timeline", () => {
    const tw = to(
      { x: 0 },
      {
        x: 10,
        duration: 0.2,
        paused: true,
        data: { id: "a", n: 1 },
      },
    );
    expect(tw.data).toEqual({ id: "a", n: 1 });
    tw.data = { id: "b" };
    expect(tw.data).toEqual({ id: "b" });

    const tl = timeline({ data: "tl-meta", paused: true });
    expect(tl.data).toBe("tl-meta");
    tl.data = 42;
    expect(tl.data).toBe(42);
  });
});
