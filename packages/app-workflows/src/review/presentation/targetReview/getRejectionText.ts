import type { ReviewStep } from "~/review/domain/types.js";

const COMMENT_LIMIT = 80;

/*
 * "Rejected at {step}: “{comment}”", the comment cut to 80 characters (QBZ-64); without a comment
 * "Rejected at {step}." and never a "by" (R216, QBZ-83 as ruled).
 */
export const getRejectionText = (step: ReviewStep): string => {
    const comment = step.comment ? step.comment.trim() : "";
    if (comment === "") {
        return `Rejected at ${step.title}.`;
    }

    let shown = comment;
    if (comment.length > COMMENT_LIMIT) {
        shown = `${comment.slice(0, COMMENT_LIMIT).trimEnd()}…`;
    }
    return `Rejected at ${step.title}: “${shown}”`;
};
