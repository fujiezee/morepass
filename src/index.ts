import { set, to, from, fromTo } from "./animate";
import { ease } from "./ease";
import { scrollTrigger } from "./scroll-trigger";
import { timeline } from "./timeline";
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
};

export const MorePass = {
  to,
  from,
  fromTo,
  set,
  timeline,
  scrollTrigger,
  ease,
};

export { to, from, fromTo, set, timeline, scrollTrigger, ease };
export default MorePass;
