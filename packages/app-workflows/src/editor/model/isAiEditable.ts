import { StepTypeId } from "~/editor/domain/StepTypeId.js";
import type { EditorStepType } from "~/editor/domain/types.js";

/*
 * The AI editor exists only when the `ai` row is available and has a config schema (R275): then
 * `listAiModels` exists too (`research2-api.md` C).
 */
export const isAiEditable = (stepTypes: EditorStepType[]): boolean => {
    const row = stepTypes.find(item => item.type === StepTypeId.Ai);
    return row !== undefined && row.available && row.configSchema !== null;
};
