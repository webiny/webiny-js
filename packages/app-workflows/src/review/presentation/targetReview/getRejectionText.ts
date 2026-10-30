import type { ReviewStep } from "~/review/domain/types.js";

/*
 * "Rejected at {step}: “{comment}”", the comment in full (the bar wraps it); without a comment
 * "Rejected at {step}." and never a "by" (R216, QBZ-83 as ruled).
 */
export const getRejectionText = (step: ReviewStep): string => {
    const comment = step.comment ? step.comment.trim() : "";
    if (comment === "") {
        return `Rejected at ${step.title}.`;
    }

    return `Rejected at ${step.title}: “${comment}”`;
};
