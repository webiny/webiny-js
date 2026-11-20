import type { ReviewListScopeVm } from "./abstractions.js";

/*
 * Every scope in design order (B2 design 1). All is shown only to viewers with `reassign` or full
 * access (R259); `getVisibleReviewListScopes` filters it, and the route parser accepts every value
 * here.
 */
export const REVIEW_LIST_SCOPES: ReviewListScopeVm[] = [
    { value: "assignedToMe", label: "Assigned to me" },
    { value: "pool", label: "Team pool" },
    { value: "teamInReview", label: "Team in review" },
    { value: "myRequests", label: "Requested by me" },
    { value: "all", label: "All" }
];
