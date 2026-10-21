export const AI_REVIEW_TIMED_OUT_REASON = "The AI review timed out.";
export const AI_REVIEW_NO_DECISION_REASON = "The AI review returned no decision.";
export const AI_REVIEW_REJECTED_WITHOUT_COMMENT_REASON =
    "The AI review rejected without a comment.";

export const getAiStepLimitReason = (steps: number): string => {
    return `The AI review did not finish in ${steps} steps.`;
};
