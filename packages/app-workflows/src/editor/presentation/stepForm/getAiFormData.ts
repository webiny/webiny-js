import type { EditorStep } from "~/editor/domain/types.js";
import { readAiConfig } from "~/editor/model/readAiConfig.js";
import type { AiFormValues } from "./StepFormData.js";
import { getCommonFormData } from "./getCommonFormData.js";

// The AI step as form values: the common fields, the instructions, the model (null for none) and every stored tool name.
export const getAiFormData = (step: EditorStep): AiFormValues => {
    const config = readAiConfig(step.config);
    const common = getCommonFormData(step);

    let model: string | null = null;
    if (config.model !== "") {
        model = config.model;
    }

    return { ...common, instructions: config.instructions, model, tools: config.tools };
};
