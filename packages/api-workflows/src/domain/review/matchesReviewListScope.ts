import type { ReviewListScope } from "./ReviewListScope.js";
import type { ReviewData } from "./types.js";

export interface ReviewListScopeMatchParams {
    scope: ReviewListScope;
    viewerUserId: string;
    viewerTeamIds: string[];
}

const sharesTeam = (review: ReviewData, teamIds: string[]): boolean => {
    return review.currentCandidateTeamIds.some(teamId => teamIds.includes(teamId));
};

/**
 * The "who" predicate of a list (B2 design 1). Pure; ANDed with `matchesReviewListState`. The
 * storage pre-filter (`createReviewListWhere`) expresses the same conditions.
 */
export const matchesReviewListScope = (
    review: ReviewData,
    params: ReviewListScopeMatchParams
): boolean => {
    switch (params.scope) {
        case "assignedToMe":
            return review.currentOwnerId === params.viewerUserId;
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
            return true;
    }
};
