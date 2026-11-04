import { StepTypeId } from "~/editor/domain/StepTypeId.js";
import type { AutomationDefinition } from "~/editor/domain/types.js";
import type { EditorStep } from "~/editor/domain/types.js";
import { getTeamSettingKeys } from "~/editor/model/getTeamSettingKeys.js";
import { readAutomationConfig } from "~/editor/model/readAutomationConfig.js";
import { readReviewConfig } from "~/editor/model/readReviewConfig.js";

const getStepTeamIds = (step: EditorStep, automations: AutomationDefinition[]): string[] => {
    if (step.type === StepTypeId.Review) {
        return readReviewConfig(step.config).teams;
    }
    if (step.type !== StepTypeId.Automation) {
        return [];
    }
    // A `ui: "team"` setting holds one team id (R271, R284); its keys come from the definition.
    const config = readAutomationConfig(step.config);
    const definition = automations.find(item => item.id === config.automationId);
    if (!definition) {
        return [];
    }
    const ids: string[] = [];
    for (const key of getTeamSettingKeys(definition.settingsSchema)) {
        const value = config.settings[key];
        if (typeof value === "string" && value !== "") {
            ids.push(value);
        }
    }
    return ids;
};

// The distinct team ids of the People steps and of the `ui: "team"` settings of the automation
// steps, in step order, for one `listTeams({ ids })` call.
export const collectTeamIds = (
    steps: EditorStep[],
    automations: AutomationDefinition[]
): string[] => {
    const ids: string[] = [];
    for (const step of steps) {
        for (const id of getStepTeamIds(step, automations)) {
            if (!ids.includes(id)) {
                ids.push(id);
            }
        }
    }
    return ids;
};
