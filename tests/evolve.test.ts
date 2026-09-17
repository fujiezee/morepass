import { describe, expect, it, beforeEach, vi } from "vitest";
import { utils, matchMedia, to, scrollTrigger } from "../src";
import { _scrollTriggerReset } from "../src/scroll-trigger";
import { ticker } from "../src/ticker";

describe("utils", () => {
  it("clamp / mapRange / interpolate / snap", () => {
    expect(utils.clamp(5, 0, 3)).toBe(3);
    expect(utils.mapRange(0, 10, 0, 100, 5)).toBeCloseTo(50, 5);
    expect(utils.interpolate(0, 10, 0.25)).toBeCloseTo(2.5, 5);
    expect(utils.snap(5, 12)).toBe(10);
    expect(utils.snap([0, 10, 20], 14)).toBe(10);
  });

  it("random picks from array", () => {
    const v = utils.random(["a", "b", "c"]);
    expect(["a", "b", "c"]).toContain(v);
  });
});

describe("matchMedia", () => {
  it("runs matching factory and cleans up on kill", () => {
    const cleanup = vi.fn();
    const enter = vi.fn(() => cleanup);

    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      writable: true,
      value: (query: string) => {
        const listeners = new Set<(e: MediaQueryListEvent) => void>();
        return {
          matches: query.includes("min-width"),
          media: query,
          addEventListener: (_: string, fn: (e: MediaQueryListEvent) => void) =>
            listeners.add(fn),
          removeEventListener: (
            _: string,
            fn: (e: MediaQueryListEvent) => void,
          ) => listeners.delete(fn),
          dispatch: (matches: boolean) => {
            for (const fn of listeners) {
              fn({ matches } as MediaQueryListEvent);
            }
          },
        };
      },
    });

    const mm = matchMedia({
      "(min-width: 800px)": enter,
      "(max-width: 100px)": () => {},
    });

    expect(enter).toHaveBeenCalled();
    mm.kill();
    expect(cleanup).toHaveBeenCalled();
  });
});

describe("scrollTrigger once + pin", () => {
  function mockRect(el: HTMLElement, top: number, height = 100) {
    el.getBoundingClientRect = () =>
      ({
        top,
        bottom: top + height,
        height,
        width: 120,
        left: 40,
        right: 160,
        x: 40,
        y: top,
        toJSON() {
          return {};
        },
      }) as DOMRect;
  }

  function setScroll(y: number) {
    Object.defineProperty(window, "scrollY", { value: y, configurable: true });
    Object.defineProperty(window, "pageYOffset", {
      value: y,
      configurable: true,
    });
    window.dispatchEvent(new Event("scroll"));
  }

  beforeEach(() => {
    ticker._reset();
    _scrollTriggerReset();
    document.body.innerHTML = `<div id="box"></div>`;
    Object.defineProperty(window, "innerHeight", {
      value: 500,
      configurable: true,
    });
    setScroll(0);
  });

  it("once prevents reverse enterBack", async () => {
    const el = document.querySelector<HTMLElement>("#box")!;
    mockRect(el, 600, 100);
    const onEnter = vi.fn();
    const onEnterBack = vi.fn();

    to(
      { v: 0 },
      {
        v: 1,
        duration: 0.01,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top bottom",
          end: "top top",
          once: true,
          onEnter,
          onEnterBack,
        },
      },
    );

    setScroll(150);
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    expect(onEnter).toHaveBeenCalledTimes(1);

    setScroll(700);
    await new Promise((r) => requestAnimationFrame(() => r(null)));

    setScroll(150);
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    expect(onEnterBack).not.toHaveBeenCalled();
  });

  it("pin sets position fixed while active", async () => {
    const el = document.querySelector<HTMLElement>("#box")!;
    mockRect(el, 600, 80);

    scrollTrigger.create({
      trigger: el,
      start: "top bottom",
      end: "top top",
      pin: true,
    });

    setScroll(200);
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    expect(el.style.position).toBe("fixed");
    expect(document.querySelector(".morepass-pin-spacer")).toBeTruthy();

    setScroll(0);
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    expect(el.style.position).not.toBe("fixed");
  });
});
