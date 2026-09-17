import { set, to, from, fromTo } from "./animate";
import { context } from "./context";
import { defaults } from "./defaults";
import { ease } from "./ease";
import { getProperty } from "./get-property";
import { isTweening, killTweensOf } from "./kill";
import { matchMedia } from "./match-media";
import { quickTo } from "./quick-to";
import { scrollTrigger } from "./scroll-trigger";
import { timeline } from "./timeline";
import { utils } from "./utils";
import type {
  EaseFn,
  EaseName,
  Position,
  StaggerFrom,
  StaggerVars,
  Target,
  TimelineControls,
  TimelineVars,
  TweenControls,
  Vars,
} from "./types";
import type {
  ScrollTriggerInstance,
  ScrollTriggerVars,
} from "./scroll-types";
import type { QuickToVars } from "./quick-to";
import type { Context } from "./context";

export type {
  EaseFn,
  EaseName,
  Position,
  StaggerFrom,
  StaggerVars,
  Target,
  TimelineControls,
  TimelineVars,
  TweenControls,
  Vars,
  ScrollTriggerInstance,
  ScrollTriggerVars,
  QuickToVars,
  Context,
};

export const MorePass = {
  to,
  from,
  fromTo,
  set,
  timeline,
  scrollTrigger,
  matchMedia,
  quickTo,
  context,
  defaults,
  getProperty,
  killTweensOf,
  isTweening,
  utils,
  ease,
};

export {
  to,
  from,
  fromTo,
  set,
  timeline,
  scrollTrigger,
  matchMedia,
  quickTo,
  context,
  defaults,
  getProperty,
  killTweensOf,
  isTweening,
  utils,
  ease,
};
export default MorePass;
