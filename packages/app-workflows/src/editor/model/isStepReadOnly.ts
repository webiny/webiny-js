import { StepTypeId } from "~/editor/domain/StepTypeId.js";
import type { EditorStep } from "~/editor/domain/types.js";
import type { EditorStepType } from "~/editor/domain/types.js";
import { isAiEditable } from "./isAiEditable.js";

const KNOWN_TYPES: string[] = Object.values(StepTypeId);

/*
 * A step of a type the editor has no form for, and an AI step while the AI editor does not exist,
 * are shown read-only and saved unchanged (R270, R275). Move and delete stay enabled (QBZ-47).
 */
export const isStepReadOnly = (step: EditorStep, stepTypes: EditorStepType[]): boolean => {
    if (!KNOWN_TYPES.includes(step.type)) {
        return true;
    }
    return step.type === StepTypeId.Ai && !isAiEditable(stepTypes);
};
