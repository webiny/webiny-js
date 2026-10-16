import type { ReviewListEmptyVm } from "./abstractions.js";
import type { ReviewListTab } from "./abstractions.js";

const TAB_EMPTY: Record<ReviewListTab, ReviewListEmptyVm> = {
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
    }
};

const FILTERED_EMPTY: ReviewListEmptyVm = {
    title: "No reviews match these filters",
    description: ""
};

const NO_TEAM_EMPTY: ReviewListEmptyVm = {
    title: "You’re not in a reviewing team",
    description: "Steps appear here once you’re added to a team that reviews content."
};

/*
 * Empty-state copy of README 8, QBZ-72 and QBZ-73. The filtered state has a title only. A viewer
 * with no teams gets the no-team text on the two team tabs; the client cannot tell which teams
 * review content, so a member of only non-reviewing teams still sees the normal text.
 */
export const getReviewListEmpty = (
    tab: ReviewListTab,
    isFiltered: boolean,
    hasTeams: boolean
): ReviewListEmptyVm => {
    if (isFiltered) {
        return FILTERED_EMPTY;
    }
    if (!hasTeams && (tab === "pool" || tab === "teamInReview")) {
        return NO_TEAM_EMPTY;
    }
    return TAB_EMPTY[tab];
};
