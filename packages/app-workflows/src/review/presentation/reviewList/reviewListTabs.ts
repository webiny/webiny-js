import type { ReviewListTabVm } from "./abstractions.js";

/*
 * All five tabs in design order (README 8, QBZ-29). Failed steps is shown only to viewers with
 * `reassign` (R259); `getVisibleReviewListTabs` filters it, and the route parser accepts every
 * value here.
 */
export const REVIEW_LIST_TABS: ReviewListTabVm[] = [
    { value: "assignedToMe", label: "Assigned to me" },
    { value: "pool", label: "Team pool" },
    { value: "teamInReview", label: "Team in review" },
    { value: "myRequests", label: "My requests" },
    { value: "failedSteps", label: "Failed steps" }
];
