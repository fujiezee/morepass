import { beforeEach, describe, expect, it, vi } from "vitest";
import { delayedCall, to, utils } from "../src";
import { ticker } from "../src/ticker";

describe("evolve v0.5", () => {
  beforeEach(() => {
    ticker._reset();
  });

  it("delayedCall fires after duration", () => {
    const fn = vi.fn();
    const tw = delayedCall(1, fn, { paused: true });
    tw.seek(0.5);
    expect(fn).not.toHaveBeenCalled();
    tw.seek(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("animates CSS variables", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    el.style.setProperty("--gap", "0");
    const tw = to(el, {
      "--gap": 40,
      duration: 1,
      ease: "none",
      paused: true,
    });
    tw.seek(0.5);
    expect(el.style.getPropertyValue("--gap")).toBe("20");
    el.remove();
  });

  it("animates attr values", () => {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    el.setAttribute("r", "10");
    document.body.appendChild(el);
    const tw = to(el, {
      attr: { r: 40 },
      duration: 1,
      ease: "none",
      paused: true,
    });
    tw.seek(0.5);
    expect(Number(el.getAttribute("r"))).toBeCloseTo(25, 5);
    el.remove();
  });

  it("clearProps removes inline styles on complete", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    const tw = to(el, {
      opacity: 0.2,
      duration: 0.01,
      clearProps: "opacity",
      paused: true,
    });
    tw.seek(0.01);
    expect(el.style.opacity).toBe("");
    el.remove();
  });

  it("utils.wrap and distribute", () => {
    expect(utils.wrap(0, 10, 12)).toBe(2);
    expect(utils.wrap(["a", "b", "c"], -1)).toBe("c");
    const dist = utils.distribute({ base: 0, amount: 10, from: "start" });
    expect(dist(0, null, [0, 1, 2])).toBeCloseTo(0, 5);
    expect(dist(2, null, [0, 1, 2])).toBeCloseTo(10, 5);
  });
});
