import type { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import type { ReviewListReadFilter } from "~/domain/review/types.js";
import {
    FAILED_STEP_LIST_TYPES,
    type ReviewListMatchParams
} from "~/domain/review/matchesReviewList.js";

/**
 * The storage pre-filter of a list (R91, A40) with the viewer's read filter (Q77). Pure. The same
 * conditions run again in code (`matchesReviewList`, `matchesReviewReadFilter`) on the primary
 * row, so this only narrows what is examined.
 */
export const createReviewListWhere = (
    params: ReviewListMatchParams,
    read: ReviewListReadFilter
): ReviewRepository.ListWhere => {
    const where: ReviewRepository.ListWhere = {
        read: {
            models: [...read.models],
            ownOnlyModels: [...read.ownOnlyModels],
            authorId: read.authorId,
            deniedFolderIds: [...read.deniedFolderIds]
        },
        // Lists return active reviews only. The app wrappers load folder rules only for the
        // models with active reviews (`ReviewRepository.listReviewedModels`); if a list ever
        // returns inactive reviews, that model set must include them too.
        isActive: true
    };
    const titleContains = params.where.titleContains?.trim();
    if (titleContains) {
        where.title_contains = titleContains;
    }

    switch (params.list) {
        case "assignedToMe":
            where.currentStepState = "inReview";
            where.currentOwnerId = params.viewerUserId;
            break;
        case "pool":
            where.currentStepState = "awaiting";
            where.currentCandidateTeamIds_in = [...params.viewerTeamIds];
            where.requesterId_not = params.viewerUserId;
            break;
        case "teamInReview":
            where.currentStepState = "inReview";
            where.currentOwnerId_not = params.viewerUserId;
            where.currentCandidateTeamIds_in = [...params.viewerTeamIds];
            break;
        case "myRequests":
            where.requesterId = params.viewerUserId;
            if (params.where.reviewState) {
                where.state = params.where.reviewState;
            }
            if (params.where.stepState) {
                where.currentStepState = params.where.stepState;
            }
            break;
        case "failedSteps":
            where.currentStepState = "failed";
            where.currentStepType_in = [...FAILED_STEP_LIST_TYPES];
            break;
    }
    return where;
};
