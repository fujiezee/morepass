import { ease } from "./ease";
import { timeline } from "./timeline";
import { set, to, from, fromTo } from "./tween";
import type {
  EaseFn,
  EaseName,
  Position,
  Target,
  TimelineControls,
  TimelineVars,
  TweenControls,
  Vars,
} from "./types";

export type {
  EaseFn,
  EaseName,
  Position,
  Target,
  TimelineControls,
  TimelineVars,
  TweenControls,
  Vars,
};

export const MorePass = {
  to,
  from,
  fromTo,
  set,
  timeline,
  ease,
};

export { to, from, fromTo, set, timeline, ease };
export default MorePass;
