import type { FormModelFactory } from "@webiny/app-admin";
import { AI_FORM_MESSAGES } from "./aiFormMessages.js";
import { buildCommonFields } from "./buildCommonFields.js";
import { STEP_FORM_RENDERER } from "./stepFormRendererNames.js";
import { validateAfterChange } from "./validateAfterChange.js";

export interface AiStepFormParams {
    // The AI step without the licence (R275, QBZ-47): every field is disabled.
    readOnly: boolean;
}

/*
 * The AI step form (R270, R275): the common fields, Instructions, Model, Tools and Notify via. One
 * body, no tabs. A new step has no model (QBZ-89).
 */
export const buildAiStepForm = (params: AiStepFormParams): FormModelFactory.Config => {
    const { readOnly } = params;

    return {
        fields: registry => {
            const common = buildCommonFields({
                registry,
                descriptionPlaceholder: AI_FORM_MESSAGES.descriptionPlaceholder,
                readOnly
            });

            const instructions = registry
                .text()
                .label("Instructions")
                .placeholder(AI_FORM_MESSAGES.instructionsPlaceholder)
                .description(AI_FORM_MESSAGES.instructionsHint)
                .renderer("textarea", { rows: 6 })
                .required(AI_FORM_MESSAGES.instructionsRequired)
                .afterChange(validateAfterChange("instructions"))
                .disabled(readOnly);

            const model = registry
                .text()
                .label("Model")
                .description(AI_FORM_MESSAGES.modelHint)
                .renderer(STEP_FORM_RENDERER.aiModel)
                .required(AI_FORM_MESSAGES.modelRequired)
                .afterChange(validateAfterChange("model"))
                .disabled(readOnly);

            const tools = registry
                .text()
                .list()
                .label("Tools")
                .renderer(STEP_FORM_RENDERER.aiTools)
                .disabled(readOnly);

            return {
                title: common.title,
                color: common.color,
                description: common.description,
                instructions,
                model,
                tools,
                notifications: common.notifications
            };
        }
    };
};
