import type { ReviewListScope } from "~/review/domain/ReviewListScope.js";
import type { ReviewListState } from "~/review/domain/ReviewListState.js";
import type { ReviewListEmptyVm } from "./abstractions.js";

const SCOPE_EMPTY: Record<ReviewListScope, ReviewListEmptyVm> = {
    assignedToMe: {
        title: "Nothing assigned to you",
        description: "Steps you own and are reviewing appear here."
    },
    pool: {
        title: "Your team pools are empty",
        description: "Steps waiting for someone in your teams to start them appear here."
    },
    teamInReview: {
        title: "Nobody in your teams is reviewing",
        description: "Steps that a teammate is reviewing appear here."
    },
    myRequests: {
        title: "You haven’t requested any reviews",
        description: "Request a review from the review bar in the content editor."
    },
    all: {
        title: "No reviews yet",
        description: "Reviews you can act on or follow appear here."
    }
};

const FAILED_EMPTY: ReviewListEmptyVm = {
    title: "No failed steps",
    description: "AI and automation steps that hit a technical error appear here."
};

const FILTERED_EMPTY_TITLE = "No reviews match these filters";

const FILTERED_EMPTY: ReviewListEmptyVm = {
    title: FILTERED_EMPTY_TITLE,
    description: "Try another title or state, or clear the filters."
};

const FILTERED_EMPTY_WITH_CONTENT_TYPE: ReviewListEmptyVm = {
    title: FILTERED_EMPTY_TITLE,
    description: "Try another title, content model or state, or clear the filters."
};

const NO_TEAM_EMPTY: ReviewListEmptyVm = {
    title: "You’re not in a reviewing team",
    description: "Steps appear here once you’re added to a team that reviews content."
};

export interface ReviewListEmptyParams {
    scope: ReviewListScope;
    state: ReviewListState;
    // A title search or a content type narrows the list.
    hasFilters: boolean;
    hasTeams: boolean;
    showContentType: boolean;
}

/*
 * Empty-state copy of README 8, QBZ-72, QBZ-73 and B2 design 1: a scope's own text at state In
 * review or All, the failed-steps text at state Failed, the filtered text otherwise. A viewer with
 * no teams gets the no-team text on the two team scopes; the client cannot tell which teams review
 * content, so a member of only non-reviewing teams still sees the normal text.
 */
export const getReviewListEmpty = (params: ReviewListEmptyParams): ReviewListEmptyVm => {
    const { scope, state } = params;
    if (params.hasFilters || state === "approved" || state === "rejected") {
        if (params.showContentType) {
            return FILTERED_EMPTY_WITH_CONTENT_TYPE;
        }
        return FILTERED_EMPTY;
    }
    if (state === "failed") {
        return FAILED_EMPTY;
    }
    if (!params.hasTeams && (scope === "pool" || scope === "teamInReview")) {
        return NO_TEAM_EMPTY;
    }
    return SCOPE_EMPTY[scope];
};
