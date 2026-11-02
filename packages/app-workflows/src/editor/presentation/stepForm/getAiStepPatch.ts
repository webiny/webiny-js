import type { EditorStep } from "~/editor/domain/types.js";
import type { EditorStepPatch } from "~/editor/model/EditorStepPatch.js";
import type { AiFormValues } from "./StepFormData.js";
import { getCommonStepPatch } from "./getCommonStepPatch.js";

/*
 * What Done writes for an AI step: the common fields and the config
 * `{ instructions, model, tools }` (R270, Review Focus 3). The instructions go back untouched, the
 * tools include the names the list no longer offers, a step with no model writes an empty one so
 * the server names the field.
 */
export const getAiStepPatch = (step: EditorStep, values: AiFormValues): EditorStepPatch => {
    const common = getCommonStepPatch(step, values);

    return {
        ...common,
        config: {
            instructions: values.instructions ?? "",
            model: values.model ?? "",
            tools: values.tools ?? []
        }
    };
};
