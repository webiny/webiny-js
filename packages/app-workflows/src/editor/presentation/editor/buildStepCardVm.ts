import { FALLBACK_STEP_COLOUR } from "~/editor/domain/stepColours.js";
import type { EditorStep } from "~/editor/domain/types.js";
import type { StepFieldError } from "~/editor/model/StepFieldError.js";
import type { StepCardVm } from "./abstractions.js";

export interface StepCardParams {
    step: EditorStep;
    // Zero based; the card shows `index + 1`.
    index: number;
    // How many steps the workflow has, to tell the last card from the others.
    count: number;
    typeLabel: string;
    summary: string;
    warnings: string[];
    errors: StepFieldError[];
    readOnly: boolean;
}

export const buildStepCardVm = (params: StepCardParams): StepCardVm => {
    const step = params.step;
    const firstError = params.errors.length > 0 ? params.errors[0].message : null;

    return {
        id: step.id,
        number: params.index + 1,
        title: step.title.trim() === "" ? "Untitled step" : step.title,
        color: step.color === "" ? FALLBACK_STEP_COLOUR : step.color,
        typeLabel: params.typeLabel,
        type: step.type,
        summary: params.summary,
        readOnly: params.readOnly,
        warnings: params.warnings,
        error: firstError,
        canMoveUp: params.index > 0,
        canMoveDown: params.index < params.count - 1
    };
};
