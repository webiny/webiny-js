import { StepTypeId } from "~/editor/domain/StepTypeId.js";
import type { EditorStepType } from "~/editor/domain/types.js";

/*
 * False only when `listStepTypes` lists the `review` row as not available (teams are off, R290).
 * A missing row means the list did not load, which must not lock the People steps.
 */
export const isReviewAvailable = (stepTypes: EditorStepType[]): boolean => {
    const row = stepTypes.find(item => item.type === StepTypeId.Review);
    return row === undefined || row.available;
};
