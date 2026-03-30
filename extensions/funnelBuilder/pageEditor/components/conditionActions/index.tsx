import React from "react";
import type { FunnelModelDto } from "../../../models/FunnelModel";
import { HideFieldConditionAction } from "../../../models/conditionActions/HideFieldConditionAction";
import { DisableFieldConditionAction } from "../../../models/conditionActions/DisableFieldConditionAction";
import { OnSubmitActivateStepConditionAction } from "../../../models/conditionActions/OnSubmitActivateStepConditionAction";
import { OnSubmitEndFunnelConditionAction } from "../../../models/conditionActions/OnSubmitEndFunnelConditionAction";
import { HideFieldConditionActionSettings } from "./HideFieldConditionActionSettings";
import { DisableFieldConditionActionSettings } from "./DisableFieldConditionActionSettings";
import { OnSubmitActivateStepConditionActionSettings } from "./OnSubmitActivateStepConditionActionSettings";
import { OnSubmitEndFunnelConditionActionSettings } from "./OnSubmitEndFunnelConditionActionSettings";

export interface ConditionActionSettingsProps {
    funnel: FunnelModelDto;
}

export interface ConditionActionDefinition {
    type: string;
    settingsRenderer?: React.ComponentType<ConditionActionSettingsProps>;
}

export const conditionActions: ConditionActionDefinition[] = [
    {
        type: HideFieldConditionAction.type,
        settingsRenderer: HideFieldConditionActionSettings
    },
    {
        type: DisableFieldConditionAction.type,
        settingsRenderer: DisableFieldConditionActionSettings
    },
    {
        type: OnSubmitActivateStepConditionAction.type,
        settingsRenderer: OnSubmitActivateStepConditionActionSettings
    },
    {
        type: OnSubmitEndFunnelConditionAction.type,
        settingsRenderer: OnSubmitEndFunnelConditionActionSettings
    }
];
