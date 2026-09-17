import { set, to, from, fromTo } from "./animate";
import { ease } from "./ease";
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
  utils,
  ease,
};
export default MorePass;
