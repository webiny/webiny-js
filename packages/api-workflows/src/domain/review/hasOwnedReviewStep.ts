import type { ReviewData } from "./types.js";

/**
 * Whether this user is the owner of any step of the review (B7, B9): the step's last owner, kept
 * after the step finished. AI and automation owners carry the requester's id (D58), so only `user`
 * owners count. Pure.
 */
export const hasOwnedReviewStep = (review: ReviewData, userId: string): boolean => {
    return review.steps.some(step => step.owner?.type === "user" && step.owner.id === userId);
};
