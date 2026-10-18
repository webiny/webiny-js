import type { ReviewListSort } from "~/review/domain/ReviewListSort.js";
import type { ReviewListTab } from "./abstractions.js";

// Work queues (Assigned to me, Team pool, Team in review, Failed steps) list the longest-waiting
// item first, My requests the newest change first (QBZ-69).
export const getDefaultReviewListSort = (tab: ReviewListTab): ReviewListSort => {
    if (tab === "myRequests") {
        return "lastChangedOn_DESC";
    }
    return "lastChangedOn_ASC";
};
