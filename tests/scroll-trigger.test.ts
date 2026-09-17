import { beforeEach, describe, expect, it, vi } from "vitest";
import { to, scrollTrigger } from "../src";
import { _scrollTriggerReset } from "../src/scroll-trigger";
import { ticker } from "../src/ticker";

function mockRect(el: HTMLElement, top: number, height = 100) {
  el.getBoundingClientRect = () =>
    ({
      top,
      bottom: top + height,
      height,
      width: 100,
      left: 0,
      right: 100,
      x: 0,
      y: top,
      toJSON() {
        return {};
      },
    }) as DOMRect;
}

function setScroll(y: number) {
  Object.defineProperty(window, "scrollY", { value: y, configurable: true });
  Object.defineProperty(window, "pageYOffset", { value: y, configurable: true });
  window.dispatchEvent(new Event("scroll"));
}

describe("scrollTrigger", () => {
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

  it("scrubs animation progress with scroll", async () => {
    const el = document.querySelector<HTMLElement>("#box")!;
    // trigger top at 600 abs when scroll=0 => rect.top=600
    mockRect(el, 600, 200);

    const target = { v: 0 };
    // Use object tween but trigger is el
    const tween = to(target, {
      v: 100,
      duration: 1,
      ease: "none",
      scrollTrigger: {
        trigger: el,
        start: "top bottom", // startScroll = 600 - 500 = 100
        end: "top top", // endScroll = 600 - 0 = 600
        scrub: true,
      },
    });

    // flush rAF from scroll listener
    setScroll(100);
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    expect((tween.progress() as number)).toBeCloseTo(0, 1);

    setScroll(350); // mid of 100..600
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    expect(target.v).toBeCloseTo(50, 0);

    setScroll(600);
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    expect(target.v).toBeCloseTo(100, 0);
  });

  it("plays on enter when not scrubbing", async () => {
    const el = document.querySelector<HTMLElement>("#box")!;
    mockRect(el, 600, 100);
    const onEnter = vi.fn();

    const target = { v: 0 };
    to(target, {
      v: 100,
      duration: 0.01,
      ease: "none",
      scrollTrigger: {
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        onEnter,
      },
    });

    setScroll(0);
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    expect(onEnter).not.toHaveBeenCalled();

    setScroll(150);
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    expect(onEnter).toHaveBeenCalled();
  });

  it("create() works without animation", async () => {
    const el = document.querySelector<HTMLElement>("#box")!;
    mockRect(el, 400, 50);
    const onUpdate = vi.fn();

    const st = scrollTrigger.create({
      trigger: el,
      start: "top bottom",
      end: "top top",
      onUpdate,
    });

    setScroll(200);
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    expect(st.progress).toBeGreaterThan(0);
    expect(onUpdate).toHaveBeenCalled();
    st.kill();
  });
});
