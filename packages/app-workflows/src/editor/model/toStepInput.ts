import { StepTypeId } from "~/editor/domain/StepTypeId.js";
import type { EditorStep } from "~/editor/domain/types.js";
import type { EditorStepInput } from "~/editor/domain/types.js";
import { createDefaultAssignment } from "./createDefaultAssignment.js";
import { readAiConfig } from "./readAiConfig.js";
import { readAutomationConfig } from "./readAutomationConfig.js";
import { readReviewConfig } from "./readReviewConfig.js";

/*
 * The config as the server's config schema of the type has it, key for key (R270, Review Focus 3):
 * no editor-only keys, the review defaults when the step has none, the stored assignment, unknown
 * transport ids and unknown AI tool names kept. A step of a type the editor has no form for is
 * saved unchanged.
 */
const toStepConfig = (step: EditorStep): unknown => {
    if (step.type === StepTypeId.Review) {
        const config = readReviewConfig(step.config);
        const assignment = config.assignment ?? createDefaultAssignment();
        return { teams: config.teams, assignment };
    }
    if (step.type === StepTypeId.Automation) {
        const config = readAutomationConfig(step.config);
        return { automationId: config.automationId, settings: config.settings };
    }
    if (step.type === StepTypeId.Ai) {
        const config = readAiConfig(step.config);
        return { instructions: config.instructions, model: config.model, tools: config.tools };
    }
    return step.config;
};

export const toStepInput = (step: EditorStep): EditorStepInput => {
    const notifications = step.notificationIds.map(id => ({ id }));
    const config = toStepConfig(step);

    return {
        id: step.id,
        title: step.title,
        color: step.color,
        description: step.description,
        type: step.type,
        notifications,
        config
    };
};
