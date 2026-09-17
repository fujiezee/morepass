import { beforeEach, describe, expect, it, vi } from "vitest";
import { to } from "../src";
import { buildStaggerDelays, staggerRank } from "../src/stagger";
import { ticker } from "../src/ticker";
import { _clearIds } from "../src/ids";

describe("evolve v0.8", () => {
  beforeEach(() => {
    ticker._reset();
    _clearIds();
  });

  it("animates blur filter on elements", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const tw = to(el, {
      blur: 12,
      duration: 1,
      ease: "none",
      paused: true,
    });
    tw.seek(0);
    expect(el.style.filter).toMatch(/blur\(0px\)/);
    tw.seek(0.5);
    expect(el.style.filter).toMatch(/blur\(6px\)/);
    tw.seek(1);
    expect(el.style.filter).toMatch(/blur\(12px\)/);
    el.remove();
  });

  it("preserves other filter functions when writing blur", () => {
    const el = document.createElement("div");
    el.style.filter = "brightness(1.2) contrast(1.1)";
    document.body.appendChild(el);
    const tw = to(el, {
      blur: 8,
      duration: 1,
      ease: "none",
      paused: true,
    });
    tw.seek(1);
    expect(el.style.filter).toContain("brightness(1.2)");
    expect(el.style.filter).toContain("contrast(1.1)");
    expect(el.style.filter).toMatch(/blur\(8px\)/);
    el.remove();
  });

  it("replaces existing blur portion in filter", () => {
    const el = document.createElement("div");
    el.style.filter = "blur(2px) grayscale(0.5)";
    document.body.appendChild(el);
    const tw = to(el, {
      blur: 10,
      duration: 1,
      ease: "none",
      paused: true,
    });
    tw.seek(0);
    expect(el.style.filter).toMatch(/blur\(2px\)/);
    expect(el.style.filter).toContain("grayscale(0.5)");
    tw.seek(1);
    expect(el.style.filter).toMatch(/blur\(10px\)/);
    expect(el.style.filter).toContain("grayscale(0.5)");
    expect(el.style.filter.match(/blur\(/g)?.length).toBe(1);
    el.remove();
  });

  it("stagger.grid ranks from start corner", () => {
    // 3x2 grid: indices 0 1 2 / 3 4 5
    expect(staggerRank(0, 6, "start", [3, 2])).toBeCloseTo(0, 5);
    expect(staggerRank(2, 6, "start", [3, 2])).toBeCloseTo(2, 5);
    expect(staggerRank(3, 6, "start", [3, 2])).toBeCloseTo(1, 5);
  });

  it("stagger.grid from center delays middle first", () => {
    const delays = buildStaggerDelays(6, {
      each: 0.1,
      from: "center",
      grid: [3, 2],
    });
    // center of 3x2 is between cells; index 1 and 4 are closest
    const min = Math.min(...delays);
    expect(delays[1]).toBeCloseTo(min, 5);
    expect(delays[0]).toBeGreaterThan(delays[1]!);
  });

  it("stagger.grid from end ranks opposite corner first", () => {
    const delays = buildStaggerDelays(6, {
      each: 0.1,
      from: "end",
      grid: [3],
    });
    expect(delays[5]).toBeCloseTo(0, 5);
    expect(delays[0]).toBeGreaterThan(delays[5]!);
  });

  it("repeatRefresh rebuilds end from function each cycle", () => {
    const t = { x: 0 };
    let end = 10;
    const tw = to(t, {
      x: () => end,
      duration: 1,
      ease: "none",
      repeat: 1,
      repeatRefresh: true,
      paused: true,
    });
    tw.seek(0.999);
    expect(t.x).toBeCloseTo(9.99, 2);
    end = 40;
    // Crossing into cycle 1 rebuilds start from current (~10) toward 40
    tw.seek(1);
    expect(t.x).toBeCloseTo(10, 1);
    tw.seek(2);
    expect(t.x).toBeCloseTo(40, 5);
  });

  it("onInterrupt fires once on explicit kill, not on complete", () => {
    const interrupt = vi.fn();
    const complete = vi.fn();
    const t = { x: 0 };
    const tw = to(t, {
      x: 100,
      duration: 1,
      ease: "none",
      paused: true,
      onInterrupt: interrupt,
      onComplete: complete,
    });
    tw.seek(0.4);
    tw.kill();
    expect(interrupt).toHaveBeenCalledTimes(1);
    expect(complete).not.toHaveBeenCalled();

    const interrupt2 = vi.fn();
    const complete2 = vi.fn();
    const t2 = { x: 0 };
    const tw2 = to(t2, {
      x: 50,
      duration: 0,
      ease: "none",
      onInterrupt: interrupt2,
      onComplete: complete2,
    });
    expect(complete2).toHaveBeenCalledTimes(1);
    tw2.kill();
    expect(interrupt2).not.toHaveBeenCalled();
  });

  it("onInterrupt fires once on overwrite:true", () => {
    const interrupt = vi.fn();
    const t = { x: 0 };
    const first = to(t, {
      x: 100,
      duration: 2,
      ease: "none",
      paused: true,
      onInterrupt: interrupt,
      overwrite: true,
    });
    first.seek(0.2);
    to(t, {
      x: 20,
      duration: 0.5,
      ease: "none",
      overwrite: true,
      paused: true,
    }).seek(0);
    expect(interrupt).toHaveBeenCalledTimes(1);
  });

  it("totalProgress maps across repeats; progress stays per-iteration", () => {
    const t = { x: 0 };
    const tw = to(t, {
      x: 100,
      duration: 1,
      ease: "none",
      repeat: 1,
      paused: true,
    });
    expect(tw.totalDuration).toBeCloseTo(2, 5);
    tw.totalProgress(0.25);
    expect(t.x).toBeCloseTo(50, 5);
    expect(tw.progress() as number).toBeCloseTo(0.5, 5);
    expect(tw.totalProgress() as number).toBeCloseTo(0.25, 5);

    tw.totalProgress(0.75);
    expect(t.x).toBeCloseTo(50, 5);
    expect(tw.totalProgress() as number).toBeCloseTo(0.75, 5);

    tw.totalProgress(1);
    expect(t.x).toBeCloseTo(100, 5);
  });
});
