import { DisableFieldConditionAction } from "./DisableFieldConditionAction";
import { HideFieldConditionAction } from "./HideFieldConditionAction";
import { OnSubmitActivateStepConditionAction } from "./OnSubmitActivateStepConditionAction";
import { OnSubmitEndFunnelConditionAction } from "./OnSubmitEndFunnelConditionAction";

export const registry = [
    DisableFieldConditionAction,
    HideFieldConditionAction,
    OnSubmitActivateStepConditionAction,
    OnSubmitEndFunnelConditionAction
];
