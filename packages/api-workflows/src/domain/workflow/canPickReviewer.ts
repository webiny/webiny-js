import type { WorkflowStep } from "./types.js";
import { parseReviewStepConfig } from "./reviewStepConfigSchema.js";
import { REVIEW_STEP_TYPE } from "./WorkflowValidator.js";

/**
 * `canPick` for one step at submit (spec 5.3, D22): a review step whose config allows a manual
 * pick. Computed from the workflow alone. The request-time conditions (write access to the
 * target, D77; which users may be picked, D33/D61) belong to the app wrapper (phase 2) and to
 * routing (phase 4).
 */
export const canPickReviewer = (step: WorkflowStep): boolean => {
    if (step.type !== REVIEW_STEP_TYPE) {
        return false;
    }
    const config = parseReviewStepConfig(step.config);
    return config?.assignment.allowManualPick === true;
};
