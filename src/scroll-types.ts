import type { Target, TweenControls } from "./types";

export type ScrollTriggerVars = {
  /** Element that defines the scroll range. Defaults to the animated element. */
  trigger?: Target | Element;
  /** Scroll container. Defaults to the window / document. */
  scroller?: Target | Element | Window;
  /** e.g. `"top bottom"`, `"top 80%"`, `"center center"` */
  start?: string;
  /** e.g. `"bottom top"`, `"bottom center"` */
  end?: string;
  /** Link animation progress to scroll. `true` or lag seconds (smoothed). */
  scrub?: boolean | number;
  /** Run enter once; ignore reverse / enterBack after completion. */
  once?: boolean;
  /** Pin the trigger (or a given element) while between start and end. */
  pin?: boolean | Target | Element;
  /** Insert spacer while pinned (default true). */
  pinSpacing?: boolean;
  /**
   * onEnter onLeave onEnterBack onLeaveBack
   * Actions: play | pause | resume | reset | restart | complete | reverse | none
   * Default: `"play none none none"`
   */
  toggleActions?: string;
  markers?: boolean;
  onEnter?: (self: ScrollTriggerInstance) => void;
  onLeave?: (self: ScrollTriggerInstance) => void;
  onEnterBack?: (self: ScrollTriggerInstance) => void;
  onLeaveBack?: (self: ScrollTriggerInstance) => void;
  onUpdate?: (self: ScrollTriggerInstance) => void;
  onToggle?: (self: ScrollTriggerInstance) => void;
  /** Attached animation (set automatically from `vars.scrollTrigger`). */
  animation?: TweenControls;
};

export interface ScrollTriggerInstance {
  readonly progress: number;
  readonly direction: 1 | -1;
  readonly isActive: boolean;
  readonly start: number;
  readonly end: number;
  refresh(): void;
  kill(): void;
}
