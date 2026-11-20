import type { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import type { ReviewListReadFilter } from "~/domain/review/types.js";
import type { ReviewListMatchParams } from "~/domain/review/matchesReviewList.js";

/**
 * The storage pre-filter of a list (R91, A40) with the viewer's read filter (Q77): the scope and
 * the state, ANDed (B2 design 1). Pure. The same conditions run again in code
 * (`matchesReviewList`, `matchesReviewReadFilter`) on the primary row, so this only narrows what
 * is examined.
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

    switch (params.scope) {
        case "assignedToMe":
            where.currentOwnerId = params.viewerUserId;
            break;
        case "pool":
            where.currentStepState = "awaiting";
            where.currentCandidateTeamIds_in = [...params.viewerTeamIds];
            where.requesterId_not = params.viewerUserId;
            break;
        case "teamInReview":
            where.hasCurrentOwner = true;
            where.currentOwnerId_not = params.viewerUserId;
            where.currentCandidateTeamIds_in = [...params.viewerTeamIds];
            break;
        case "myRequests":
            where.requesterId = params.viewerUserId;
            break;
        case "all":
            break;
    }

    switch (params.where.state ?? "all") {
        case "all":
            break;
        case "inReview":
            where.state = "inProgress";
            // The pool's `awaiting` already rules a failed step out.
            if (where.currentStepState === undefined) {
                where.currentStepState_not = "failed";
            }
            break;
        case "failed":
            // Empty-by-definition pairs (pool × failed) never get here (`isEmptyReviewListFilter`).
            where.state = "inProgress";
            where.currentStepState = "failed";
            break;
        case "approved":
            where.state = "approved";
            break;
        case "rejected":
            where.state = "rejected";
            break;
    }
    return where;
};
