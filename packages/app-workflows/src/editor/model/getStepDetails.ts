import { StepTypeId } from "~/editor/domain/StepTypeId.js";
import type { EditorStep } from "~/editor/domain/types.js";
import { getAssignmentSummary } from "./getAssignmentSummary.js";
import { getReviewTeamNames } from "./getReviewTeamNames.js";
import { readAiConfig } from "./readAiConfig.js";
import { readAutomationConfig } from "./readAutomationConfig.js";
import { readReviewConfig } from "./readReviewConfig.js";
import type { StepContext } from "./StepContext.js";
import type { StepDetailRow } from "./StepDetailRow.js";

function getReviewDetails(step: EditorStep, context: StepContext): StepDetailRow[] {
    // Team names do not resolve while teams are off, so a step of an unavailable review row has none.
    if (!context.reviewAvailable) {
        return [];
    }
    const config = readReviewConfig(step.config);
    if (config.teams.length === 0) {
        return [];
    }
    const rows: StepDetailRow[] = [
        { label: "Reviewing teams", value: getReviewTeamNames(step, context).join(", ") }
    ];
    const assignment = getAssignmentSummary(step);
    if (assignment !== "") {
        rows.push({ label: "Assignment", value: assignment });
    }
    return rows;
}

function getAutomationDetails(step: EditorStep, context: StepContext): StepDetailRow[] {
    const config = readAutomationConfig(step.config);
    const definition = context.automations.find(item => item.id === config.automationId);
    const rows: StepDetailRow[] = [
        { label: "Automation", value: definition ? definition.name : config.automationId }
    ];
    // Only a step whose settings hold a URL shows one.
    const settings = config.settings;
    if (typeof settings.url === "string" && settings.url !== "") {
        rows.push({ label: "URL", value: settings.url });
    }
    return rows;
}

function getAiDetails(step: EditorStep, context: StepContext): StepDetailRow[] {
    const config = readAiConfig(step.config);
    const rows: StepDetailRow[] = [];
    if (config.model !== "") {
        const models = context.aiModels;
        const model = models === null ? undefined : models.find(item => item.id === config.model);
        rows.push({ label: "Model", value: model ? model.name : config.model });
    }
    if (config.tools.length > 0) {
        const listed = context.aiTools;
        const names = config.tools.map(name => {
            const tool = listed === null ? undefined : listed.find(item => item.name === name);
            if (tool === undefined) {
                return name;
            }
            return tool.changesContent ? `${tool.label} (changes content)` : tool.label;
        });
        rows.push({ label: "Tools", value: names.join(", ") });
    }
    return rows;
}

/*
 * The key and value rows in the expanded body of a step card: People `Reviewing teams` and
 * `Assignment`, AI `Model` and `Tools`, Automation `Automation` and, when its settings hold one,
 * `URL`. A row without a value is left out; a type the editor has no form for has none. Pure.
 */
export const getStepDetails = (step: EditorStep, context: StepContext): StepDetailRow[] => {
    if (step.type === StepTypeId.Review) {
        return getReviewDetails(step, context);
    }
    if (step.type === StepTypeId.Automation) {
        return getAutomationDetails(step, context);
    }
    if (step.type === StepTypeId.Ai) {
        return getAiDetails(step, context);
    }
    return [];
};
