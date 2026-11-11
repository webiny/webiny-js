import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import { StepTypeId } from "~/editor/domain/StepTypeId.js";
import type { AutomationDefinition } from "~/editor/domain/types.js";
import type { EditorStepType } from "~/editor/domain/types.js";
import { getStepTypeLabel } from "./getStepTypeLabel.js";
import { isAiEditable } from "./isAiEditable.js";
import { matchesAutomationScope } from "./matchesAutomationScope.js";

export interface StepTypeOptionsParams {
    stepTypes: EditorStepType[];
    automations: AutomationDefinition[];
    // The workflow's model, e.g. `cms.article` or `wb.page`.
    namespace: string;
    appKind: WorkflowAppKind;
}

// Render-ready (R234): the type picker shows `label`, `description` and, when not addable, `reason`.
export interface StepTypeOption {
    type: string;
    label: string;
    description: string | null;
    addable: boolean;
    reason: string | null;
}

const DESCRIPTIONS: Record<string, string> = {
    [StepTypeId.Review]: "Members of one or more teams review.",
    [StepTypeId.Automation]: "Runs a code-defined automation, such as Send webhook.",
    [StepTypeId.Ai]: "An AI model reviews against your written instructions."
};

const AI_REASON = "Requires the AI Power-Ups licence.";
const AUTOMATION_REASON_CMS = "No automations are available for this model.";
const AUTOMATION_REASON_WB = "No automations are available for pages.";

interface Availability {
    addable: boolean;
    reason: string | null;
}

function getAvailability(item: EditorStepType, params: StepTypeOptionsParams): Availability {
    if (item.type === StepTypeId.Ai) {
        const addable = isAiEditable(params.stepTypes);
        return { addable, reason: addable ? null : AI_REASON };
    }
    if (item.type === StepTypeId.Automation) {
        const covering = params.automations.filter(definition => {
            return matchesAutomationScope(definition.models, [params.namespace]);
        });
        const addable = item.available && covering.length > 0;
        const reason = params.appKind === "wb" ? AUTOMATION_REASON_WB : AUTOMATION_REASON_CMS;
        return { addable, reason: addable ? null : reason };
    }
    if (item.type === StepTypeId.Review) {
        return {
            addable: item.available,
            reason: item.available ? null : item.unavailableReason
        };
    }
    // A type the editor has no form for is listed but never addable; no design copy exists for it.
    return { addable: false, reason: item.unavailableReason };
}

// The picker order: People, Automation, AI. A type the picker has no slot for follows, in the order returned.
const PICKER_ORDER: string[] = [StepTypeId.Review, StepTypeId.Automation, StepTypeId.Ai];

function getPickerRank(type: string): number {
    const rank = PICKER_ORDER.indexOf(type);
    if (rank === -1) {
        return PICKER_ORDER.length;
    }
    return rank;
}

/*
 * Every type from `listStepTypes`, in the picker order, with whether it can be added and why not
 * (R269, D122, D35, QBZ-97). Pure.
 */
export const getStepTypeOptions = (params: StepTypeOptionsParams): StepTypeOption[] => {
    const ordered = [...params.stepTypes].sort(
        (a, b) => getPickerRank(a.type) - getPickerRank(b.type)
    );
    return ordered.map(item => {
        const availability = getAvailability(item, params);
        const description = DESCRIPTIONS[item.type];

        return {
            type: item.type,
            label: getStepTypeLabel(item.type, params.stepTypes),
            description: description === undefined ? null : description,
            addable: availability.addable,
            reason: availability.reason
        };
    });
};
