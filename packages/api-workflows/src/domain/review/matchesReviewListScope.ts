import type { ReviewListScope } from "./ReviewListScope.js";
import type { ReviewData } from "./types.js";
import { hasOwnedReviewStep } from "./hasOwnedReviewStep.js";

export interface ReviewListScopeMatchParams {
    scope: ReviewListScope;
    viewerUserId: string;
    viewerTeamIds: string[];
    /** The viewer holds `reassign` ("Reassign and operate"): `all` is every review (B7). */
    viewerCanReassign: boolean;
}

const sharesTeam = (review: ReviewData, teamIds: string[]): boolean => {
    return review.currentCandidateTeamIds.some(teamId => teamIds.includes(teamId));
};

/**
 * The "who" predicate of a list (B2 design 1). Pure; ANDed with `matchesReviewListState`. The
 * storage pre-filter (`createReviewListWhere`) expresses the same conditions, or a wider set.
 */
export const matchesReviewListScope = (
    review: ReviewData,
    params: ReviewListScopeMatchParams
): boolean => {
    switch (params.scope) {
        case "assignedToMe":
            if (review.currentOwnerId === params.viewerUserId) {
                return true;
            }
            // A finished review stays with everyone who owned one of its steps (B9).
            return (
                (review.state === "approved" || review.state === "rejected") &&
                hasOwnedReviewStep(review, params.viewerUserId)
            );
        case "pool":
            return (
                review.currentStepState === "awaiting" &&
                sharesTeam(review, params.viewerTeamIds) &&
                review.createdBy.id !== params.viewerUserId
            );
        case "teamInReview":
            return (
                review.currentOwnerId !== null &&
                review.currentOwnerId !== params.viewerUserId &&
                sharesTeam(review, params.viewerTeamIds)
            );
        case "myRequests":
            return review.createdBy.id === params.viewerUserId;
        case "all":
            if (params.viewerCanReassign) {
                return true;
            }
            // Everyone else: the reviews that involve the viewer (B7).
            return (
                review.createdBy.id === params.viewerUserId ||
                sharesTeam(review, params.viewerTeamIds) ||
                review.currentOwnerId === params.viewerUserId ||
                hasOwnedReviewStep(review, params.viewerUserId)
            );
    }
};
