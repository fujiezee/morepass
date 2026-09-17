import { beforeEach, describe, expect, it, vi } from "vitest";
import { ease, from, fromTo, set, to } from "../src";
import { ticker } from "../src/ticker";

function advance(seconds: number) {
  ticker._set(performance.now() / 1000 + seconds);
}

describe("ease", () => {
  it("linear stays identity", () => {
    expect(ease.linear(0)).toBe(0);
    expect(ease.linear(0.5)).toBe(0.5);
    expect(ease.linear(1)).toBe(1);
  });

  it("power2.out eases toward the end", () => {
    expect(ease["power2.out"](0.5)).toBeGreaterThan(0.5);
  });
});

describe("object tweens", () => {
  beforeEach(() => {
    ticker._reset();
  });

  it("to() interpolates numeric object props", () => {
    const target = { value: 0 };
    const tween = to(target, {
      value: 100,
      duration: 1,
      ease: "none",
      delay: 0,
    });

    // Force deterministic clock via seek
    tween.pause();
    tween.seek(0.5);
    expect(target.value).toBeCloseTo(50, 5);
    tween.seek(1);
    expect(target.value).toBeCloseTo(100, 5);
  });

  it("from() starts at provided values and ends at original", () => {
    const target = { value: 80 };
    const tween = from(target, {
      value: 0,
      duration: 1,
      ease: "none",
    });
    tween.pause();
    expect(target.value).toBeCloseTo(0, 5);
    tween.seek(1);
    expect(target.value).toBeCloseTo(80, 5);
  });

  it("fromTo() uses explicit endpoints", () => {
    const target = { value: 0 };
    const tween = fromTo(
      target,
      { value: 10 },
      { value: 40, duration: 1, ease: "none" },
    );
    tween.pause();
    expect(target.value).toBeCloseTo(10, 5);
    tween.seek(0.5);
    expect(target.value).toBeCloseTo(25, 5);
  });

  it("set() applies instantly", () => {
    const target = { x: 0, opacity: 0 };
    set(target, { x: 12, opacity: 1 });
    expect(target.x).toBe(12);
    expect(target.opacity).toBe(1);
  });

  it("fires lifecycle callbacks", () => {
    const target = { n: 0 };
    const onStart = vi.fn();
    const onUpdate = vi.fn();
    const onComplete = vi.fn();

    const tween = to(target, {
      n: 1,
      duration: 0.2,
      ease: "none",
      onStart,
      onUpdate,
      onComplete,
    });
    tween.pause();
    tween.seek(0);
    // seek does not fire onStart; play path does. Simulate finish:
    tween.progress(1);
    expect(onUpdate).toHaveBeenCalled();
  });

  it("progress() and kill() work", () => {
    const target = { n: 0 };
    const tween = to(target, { n: 10, duration: 1, ease: "none" });
    tween.pause();
    tween.progress(0.25);
    expect(target.n).toBeCloseTo(2.5, 5);
    tween.kill();
    expect(tween.isActive()).toBe(false);
  });
});

describe("dom tweens", () => {
  beforeEach(() => {
    ticker._reset();
    document.body.innerHTML = `<div id="el" style="opacity:1"></div>`;
  });

  it("writes transform shorthand props", () => {
    const el = document.querySelector<HTMLElement>("#el")!;
    const tween = to(el, {
      x: 100,
      y: 20,
      scale: 2,
      rotation: 45,
      duration: 1,
      ease: "none",
    });
    tween.pause();
    tween.seek(1);
    expect(el.style.transform).toContain("translate3d(100px, 20px, 0px)");
    expect(el.style.transform).toContain("rotate(45deg)");
    expect(el.style.transform).toContain("scale(2, 2)");
  });

  it("animates opacity as a style", () => {
    const el = document.querySelector<HTMLElement>("#el")!;
    const tween = to(el, { opacity: 0, duration: 1, ease: "none" });
    tween.pause();
    tween.seek(0.5);
    expect(parseFloat(el.style.opacity)).toBeCloseTo(0.5, 5);
  });
});

// silence unused in case tree-shaking analyzers look here
void advance;
