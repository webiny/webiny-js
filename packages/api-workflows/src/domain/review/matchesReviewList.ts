import { AI_STEP_TYPE, AUTOMATION_STEP_TYPE } from "~/domain/workflow/stepTypes.js";
import type { ReviewData, ReviewListKind, ReviewListWhere } from "./types.js";

/** Current step types the failed steps list shows (D112). */
export const FAILED_STEP_LIST_TYPES: readonly string[] = [AI_STEP_TYPE, AUTOMATION_STEP_TYPE];

export interface ReviewListMatchParams {
    list: ReviewListKind;
    viewerUserId: string;
    viewerTeamIds: string[];
    /** Namespace ids the app lists. */
    models: string[];
    where: ReviewListWhere;
}

const sharesTeam = (review: ReviewData, teamIds: string[]): boolean => {
    return review.currentCandidateTeamIds.some(teamId => teamIds.includes(teamId));
};

/**
 * Whether a review belongs to a list for one viewer (spec 11, R91). Pure. Run on the
 * primary-storage row of every listed hit: the storage pre-filter can be stale (R18) or, on a
 * storage that cannot express a condition, missing (A40).
 */
export const matchesReviewList = (review: ReviewData, params: ReviewListMatchParams): boolean => {
    if (!review.isActive || !params.models.includes(review.model)) {
        return false;
    }
    // Storage `title_contains` matches each word anywhere (case-insensitive), so code does too.
    const titleWords = (params.where.titleContains ?? "")
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);
    const title = review.title.toLowerCase();
    if (titleWords.length && !titleWords.every(word => title.includes(word))) {
        return false;
    }

    switch (params.list) {
        case "assignedToMe":
            return (
                review.currentStepState === "inReview" &&
                review.currentOwnerId === params.viewerUserId
            );
        case "pool":
            return (
                review.currentStepState === "awaiting" &&
                sharesTeam(review, params.viewerTeamIds) &&
                review.createdBy.id !== params.viewerUserId
            );
        case "teamInReview":
            return (
                review.currentStepState === "inReview" &&
                review.currentOwnerId !== params.viewerUserId &&
                sharesTeam(review, params.viewerTeamIds)
            );
        case "myRequests":
            return (
                review.createdBy.id === params.viewerUserId &&
                (!params.where.reviewState || review.state === params.where.reviewState) &&
                (!params.where.stepState || review.currentStepState === params.where.stepState)
            );
        case "failedSteps":
            return (
                review.currentStepState === "failed" &&
                review.currentStepType !== null &&
                FAILED_STEP_LIST_TYPES.includes(review.currentStepType)
            );
    }
};
