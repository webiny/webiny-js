import type { EditorStep } from "~/editor/domain/types.js";
import type { EditorStepPatch } from "~/editor/model/EditorStepPatch.js";
import type { CommonFormValues } from "./StepFormData.js";
import { isValidStepColour } from "./isValidStepColour.js";

/*
 * The common part of what Done writes (R270): an unfinished hex or a cleared colour stays in the
 * field and never reaches the draft, so the step keeps its colour (R273).
 */
export const getCommonStepPatch = (step: EditorStep, values: CommonFormValues): EditorStepPatch => {
    let color = step.color;
    if (values.color && isValidStepColour(values.color)) {
        color = values.color;
    }

    let description: string | null = null;
    if (values.description) {
        description = values.description;
    }

    return {
        title: values.title ?? "",
        color,
        description,
        notificationIds: values.notifications ?? []
    };
};
