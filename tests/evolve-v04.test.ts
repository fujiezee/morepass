import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  context,
  defaults,
  getProperty,
  isTweening,
  killTweensOf,
  to,
} from "../src";
import { _resetDefaults } from "../src/defaults";
import { ticker } from "../src/ticker";

describe("evolve v0.4", () => {
  beforeEach(() => {
    ticker._reset();
    _resetDefaults();
  });

  it("killTweensOf stops live tweens", () => {
    const t = { x: 0 };
    const tw = to(t, { x: 100, duration: 1, ease: "none" });
    expect(isTweening(t)).toBe(true);
    killTweensOf(t);
    expect(tw.isActive()).toBe(false);
    expect(isTweening(t)).toBe(false);
  });

  it("context collects and reverts", () => {
    const a = { x: 0 };
    const b = { y: 0 };
    const ctx = context(() => {
      to(a, { x: 50, duration: 1 });
      to(b, { y: 50, duration: 1 });
    });
    expect(ctx.animations.length).toBe(2);
    expect(isTweening(a)).toBe(true);
    ctx.revert();
    expect(isTweening(a)).toBe(false);
    expect(isTweening(b)).toBe(false);
  });

  it("getProperty reads object and transform bag", () => {
    const obj = { n: 7 };
    expect(getProperty(obj, "n")).toBe(7);

    const el = document.createElement("div");
    document.body.appendChild(el);
    to(el, { x: 40, duration: 0, paused: true }).seek(0);
    // duration 0 finishes immediately — set via seek on paused with duration
    const tw = to(el, { x: 40, duration: 1, ease: "none", paused: true });
    tw.seek(1);
    expect(getProperty(el, "x")).toBeCloseTo(40, 5);
    el.remove();
  });

  it("autoAlpha drives opacity", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    el.style.opacity = "1";
    const tw = to(el, {
      autoAlpha: 0,
      duration: 1,
      ease: "none",
      paused: true,
    });
    tw.seek(1);
    expect(el.style.opacity).toBe("0");
    expect(el.style.visibility).toBe("hidden");
    el.remove();
  });

  it("timeScale is gettable/settable", () => {
    const t = { x: 0 };
    const tw = to(t, { x: 100, duration: 1, ease: "none", paused: true });
    expect(tw.timeScale()).toBe(1);
    tw.timeScale(2);
    expect(tw.timeScale()).toBe(2);
  });

  it("onRepeat fires across cycles", () => {
    const t = { x: 0 };
    const onRepeat = vi.fn();
    const tw = to(t, {
      x: 10,
      duration: 1,
      ease: "none",
      repeat: 2,
      paused: true,
      onRepeat,
    });
    tw.seek(1.1);
    expect(onRepeat).toHaveBeenCalled();
  });

  it("defaults merge into tweens", () => {
    defaults({ duration: 2, ease: "none" });
    const t = { x: 0 };
    const tw = to(t, { x: 100, paused: true });
    expect(tw.duration).toBe(2);
    tw.seek(1);
    expect(t.x).toBeCloseTo(50, 5);
    defaults({});
  });
});
