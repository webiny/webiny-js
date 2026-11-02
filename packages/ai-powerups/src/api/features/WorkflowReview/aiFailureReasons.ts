/**
 * The fixed texts a step shows when it cannot run (R170). One source for the step type's reach
 * and the runner: the raw provider, settings or decrypt error is never part
 * of any of them.
 */
export const AI_STEP_INVALID_CONFIGURATION_REASON = "The AI step configuration is not valid.";

export const aiToolNotAvailableReason = (name: string): string => {
    return `The AI tool "${name}" is not available.`;
};

export const aiModelNotAvailableReason = (model: string): string => {
    return `The model "${model}" is not available.`;
};

export const AI_CAPABILITY_NOT_AVAILABLE_REASON = "The AI review capability is not available.";

export const AI_REVIEW_FAILED_REASON = "The AI review failed.";

export const AI_REVIEW_NOT_STARTED_REASON = "The AI review could not be started.";
