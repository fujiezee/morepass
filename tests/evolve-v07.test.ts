import { beforeEach, describe, expect, it } from "vitest";
import { timeline, to } from "../src";
import { ticker } from "../src/ticker";
import { _clearIds } from "../src/ids";

describe("evolve v0.7", () => {
  beforeEach(() => {
    ticker._reset();
    _clearIds();
  });

  it("resolves function end values in plain to()", () => {
    const t = { x: 0 };
    const tw = to(t, {
      x: () => 40,
      duration: 1,
      ease: "none",
      paused: true,
    });
    tw.seek(1);
    expect(t.x).toBeCloseTo(40, 5);
  });

  it("resolves function values with index for multi-target", () => {
    const a = { n: 0 };
    const b = { n: 0 };
    const tw = to([a, b], {
      n: (i: number) => (i + 1) * 10,
      duration: 1,
      ease: "none",
      paused: true,
    });
    tw.seek(1);
    expect(a.n).toBeCloseTo(10, 5);
    expect(b.n).toBeCloseTo(20, 5);
  });

  it("snaps with increment", () => {
    const t = { x: 0 };
    const tw = to(t, {
      x: 100,
      snap: { x: 25 },
      duration: 1,
      ease: "none",
      paused: true,
    });
    tw.seek(0.3);
    expect(t.x).toBe(25);
    tw.seek(0.5);
    expect(t.x).toBe(50);
  });

  it("snaps to nearest array value", () => {
    const t = { x: 0 };
    const tw = to(t, {
      x: 100,
      snap: { x: [0, 50, 100] },
      duration: 1,
      ease: "none",
      paused: true,
    });
    tw.seek(0.2);
    expect(t.x).toBe(0);
    tw.seek(0.4);
    expect(t.x).toBe(50);
    tw.seek(0.9);
    expect(t.x).toBe(100);
  });

  it("then() resolves on complete", async () => {
    const t = { x: 0 };
    const tw = to(t, { x: 10, duration: 0, ease: "none" });
    await tw;
    expect(t.x).toBeCloseTo(10, 5);
  });

  it("then() resolves on kill (await-friendly)", async () => {
    const t = { x: 0 };
    const tw = to(t, { x: 100, duration: 2, ease: "none", paused: true });
    tw.play();
    const pending = tw.then(() => "done");
    tw.kill();
    await expect(pending).resolves.toBe("done");
  });

  it("timeline then() resolves on complete", async () => {
    const t = { x: 0 };
    const tl = timeline({ paused: true });
    tl.to(t, { x: 5, duration: 0, ease: "none" });
    tl.play();
    await tl;
    expect(t.x).toBeCloseTo(5, 5);
  });

  it("invalidate() rebuilds end from function using current state", () => {
    const t = { x: 10 };
    let end = 50;
    const tw = to(t, {
      x: () => end,
      duration: 1,
      ease: "none",
      paused: true,
    });
    tw.seek(1);
    expect(t.x).toBeCloseTo(50, 5);

    t.x = 20;
    end = 80;
    tw.invalidate();
    tw.seek(0);
    tw.seek(1);
    expect(t.x).toBeCloseTo(80, 5);
  });

  it("invalidate() re-reads start from current object state", () => {
    const t = { x: 0 };
    const tw = to(t, {
      x: 100,
      duration: 1,
      ease: "none",
      paused: true,
    });
    tw.seek(0.5);
    expect(t.x).toBeCloseTo(50, 5);

    t.x = 0;
    tw.invalidate();
    tw.seek(0);
    expect(t.x).toBeCloseTo(0, 5);
    tw.seek(1);
    expect(t.x).toBeCloseTo(100, 5);
  });

  it("animates skewX / skewY on elements", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const tw = to(el, {
      skewX: 20,
      skewY: 10,
      duration: 1,
      ease: "none",
      paused: true,
    });
    tw.seek(1);
    expect(el.style.transform).toContain("skewX(20deg)");
    expect(el.style.transform).toContain("skewY(10deg)");
    el.remove();
  });
});
