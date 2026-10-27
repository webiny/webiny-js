import { FALLBACK_STEP_COLOUR } from "~/editor/domain/stepColours.js";
import type { EditorStep } from "~/editor/domain/types.js";
import type { StepFieldError } from "~/editor/model/StepFieldError.js";
import type { StepWarningLine } from "~/editor/model/StepWarningLine.js";
import type { StepCardVm } from "./abstractions.js";
import { omitShownError } from "./omitShownError.js";
import type { ShownCardError } from "./ShownCardError.js";

export interface StepCardParams {
    step: EditorStep;
    // Zero based; the card shows `index + 1`.
    index: number;
    // How many steps the workflow has, to tell the last card from the others.
    count: number;
    typeLabel: string;
    summary: string;
    warnings: StepWarningLine[];
    errors: StepFieldError[];
    // The step's rule ids in order, to number a rule error (R303).
    ruleIds: string[];
    readOnly: boolean;
}

export const buildStepCardVm = (params: StepCardParams): StepCardVm => {
    const step = params.step;
    const firstError = params.errors.length > 0 ? params.errors[0] : null;
    let error: string | null = null;
    let rulePrefix: string | null = null;
    if (firstError !== null) {
        error = firstError.message;
        const position = params.ruleIds.indexOf(firstError.ruleId ?? "");
        if (firstError.ruleId !== null && position !== -1) {
            rulePrefix = `Rule ${position + 1}: `;
            error = `${rulePrefix}${firstError.message}`;
        }
    }
    let shown: ShownCardError | null = null;
    if (error !== null) {
        shown = { text: error, rulePrefix };
    }

    return {
        id: step.id,
        number: params.index + 1,
        title: step.title.trim() === "" ? "Untitled step" : step.title,
        color: step.color === "" ? FALLBACK_STEP_COLOUR : step.color,
        typeLabel: params.typeLabel,
        type: step.type,
        summary: params.summary,
        readOnly: params.readOnly,
        warnings: omitShownError(params.warnings, shown),
        error,
        canMoveUp: params.index > 0,
        canMoveDown: params.index < params.count - 1
    };
};
