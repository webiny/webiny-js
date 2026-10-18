import { StepTypeId } from "~/editor/domain/StepTypeId.js";
import type { EditorStep } from "~/editor/domain/types.js";
import { getAutomationWarnings } from "./getAutomationWarnings.js";
import { isEqualJson } from "./isEqualJson.js";
import { readAiConfig } from "./readAiConfig.js";
import { readAutomationConfig } from "./readAutomationConfig.js";
import { readReviewConfig } from "./readReviewConfig.js";
import type { StepContext } from "./StepContext.js";

const LICENCE_WARNING =
    "AI Power-Ups licence missing. This step fails when reached and can be restarted once the licence is back.";

function getReviewWarnings(step: EditorStep, context: StepContext): string[] {
    const config = readReviewConfig(step.config);
    const warnings: string[] = [];
    for (const id of config.teams) {
        const team = context.teams.find(item => item.id === id);
        if (team && team.memberCount === 0) {
            warnings.push(`${team.name} has no members.`);
        }
    }
    return warnings;
}

function getAutomationStepWarnings(step: EditorStep, context: StepContext): string[] {
    // A list that did not load cannot call an automation gone (the options banner says so).
    if (!context.automationsLoaded) {
        return [];
    }
    const current = readAutomationConfig(step.config);
    const baseline =
        context.baselineStep === null ? null : readAutomationConfig(context.baselineStep.config);
    // QBZ-13: only the settings saved on the server, and only while the admin has not touched them.
    const pristine =
        baseline !== null &&
        baseline.automationId === current.automationId &&
        isEqualJson(baseline.settings, current.settings);
    const warnings = getAutomationWarnings({
        definitions: context.automations,
        selectedId: current.automationId === "" ? null : current.automationId,
        storedSettings: baseline === null ? undefined : baseline.settings,
        settingsPristine: pristine
    });
    return [warnings.warning, warnings.settingsWarning].filter(
        (warning): warning is string => warning !== null
    );
}

function getAiWarnings(step: EditorStep, context: StepContext): string[] {
    if (!context.aiEditable) {
        return [LICENCE_WARNING];
    }
    const config = readAiConfig(step.config);
    const models = context.aiModels;
    if (config.model === "" || models === null || models.length === 0) {
        return [];
    }
    if (models.some(item => item.id === config.model)) {
        return [];
    }
    return [
        `The AI model “${config.model}” is no longer offered. Choose another model; until then this step fails when reached.`
    ];
}

/*
 * The amber warning lines of a step card (R272-R275, QBZ-8, QBZ-13, QBZ-47). Warnings never block
 * a save. Pure.
 */
export const getStepWarnings = (step: EditorStep, context: StepContext): string[] => {
    if (step.type === StepTypeId.Review) {
        return getReviewWarnings(step, context);
    }
    if (step.type === StepTypeId.Automation) {
        return getAutomationStepWarnings(step, context);
    }
    if (step.type === StepTypeId.Ai) {
        return getAiWarnings(step, context);
    }
    return [];
};
