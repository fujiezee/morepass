import { beforeEach, describe, expect, it } from "vitest";
import { formatColor, mixColor, parseColor } from "../src/color";
import { fromTo, to } from "../src";
import { ticker } from "../src/ticker";

describe("color", () => {
  it("parses hex and rgb", () => {
    expect(parseColor("#f00")).toEqual({ r: 255, g: 0, b: 0, a: 1 });
    expect(parseColor("#00ff00")).toEqual({ r: 0, g: 255, b: 0, a: 1 });
    expect(parseColor("rgb(10, 20, 30)")).toEqual({
      r: 10,
      g: 20,
      b: 30,
      a: 1,
    });
    expect(parseColor("rgba(10, 20, 30, 0.5)")?.a).toBeCloseTo(0.5, 5);
  });

  it("mixes and formats", () => {
    const mid = mixColor(
      { r: 0, g: 0, b: 0, a: 1 },
      { r: 100, g: 0, b: 0, a: 1 },
      0.5,
    );
    expect(mid.r).toBeCloseTo(50, 5);
    expect(formatColor(mid)).toBe("rgb(50, 0, 0)");
  });
});

describe("color tweens", () => {
  beforeEach(() => {
    ticker._reset();
    document.body.innerHTML = `<div id="el" style="background-color:#000000;color:#ffffff"></div>`;
  });

  it("interpolates backgroundColor on DOM", () => {
    const el = document.querySelector<HTMLElement>("#el")!;
    const tween = fromTo(
      el,
      { backgroundColor: "#000000" },
      { backgroundColor: "#ffffff", duration: 1, ease: "none" },
    );
    tween.pause();
    tween.seek(0.5);
    const bg = el.style.backgroundColor;
    expect(bg).toMatch(/rgb/);
    // mid gray
    expect(bg).toContain("128");
  });

  it("interpolates color strings on objects", () => {
    const target = { color: "#000000" };
    const tween = to(target, {
      color: "#0000ff",
      duration: 1,
      ease: "none",
    });
    tween.pause();
    tween.seek(0.5);
    expect(String(target.color)).toMatch(/rgb/);
  });
});

describe("overwrite", () => {
  beforeEach(() => {
    ticker._reset();
  });

  it("auto-kills conflicting props when a new tween starts", () => {
    const target = { x: 0, y: 0 };
    const first = to(target, {
      x: 100,
      y: 100,
      duration: 1,
      ease: "none",
    });
    first.pause();
    first.seek(0.5);
    expect(target.x).toBeCloseTo(50, 5);

    const second = to(target, {
      x: 0,
      duration: 1,
      ease: "none",
    });
    second.pause();
    second.seek(0); // claims x, disables first.x

    first.seek(1);
    // first can still drive y
    expect(target.y).toBeCloseTo(100, 5);
    // x stays under second's control (start was ~50 when second was built)
    second.seek(1);
    expect(target.x).toBeCloseTo(0, 5);
  });

  it("leaves non-conflicting props running", () => {
    const target = { x: 0, y: 0 };
    const first = to(target, {
      x: 100,
      y: 100,
      duration: 1,
      ease: "none",
    });
    first.pause();
    first.seek(0); // claim props

    const second = to(target, {
      x: 200,
      duration: 1,
      ease: "none",
    });
    second.pause();
    second.seek(0); // steals x

    first.seek(1);
    // y still owned by first
    expect(target.y).toBeCloseTo(100, 5);
    // x owned by second at its start value (whatever was current when second built)
    second.seek(1);
    expect(target.x).toBeCloseTo(200, 5);
  });

  it("overwrite:false keeps both props updating (last write wins per frame)", () => {
    const target = { n: 0 };
    const a = to(target, {
      n: 100,
      duration: 1,
      ease: "none",
      overwrite: false,
    });
    const b = to(target, {
      n: 50,
      duration: 1,
      ease: "none",
      overwrite: false,
    });
    a.pause();
    b.pause();
    a.seek(1);
    expect(target.n).toBeCloseTo(100, 5);
    b.seek(1);
    expect(target.n).toBeCloseTo(50, 5);
  });
});
