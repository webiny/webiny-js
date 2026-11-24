import type { ReviewListScopeVm } from "./abstractions.js";

/*
 * Every scope in design order (B2 design 1), open to every viewer (designer answer B7). All lists
 * every review of the app for a viewer with `reassign`, else the reviews that involve the viewer.
 */
export const REVIEW_LIST_SCOPES: ReviewListScopeVm[] = [
    { value: "assignedToMe", label: "Assigned to me" },
    { value: "pool", label: "Team pool" },
    { value: "teamInReview", label: "Team in review" },
    { value: "myRequests", label: "Requested by me" },
    { value: "all", label: "All" }
];
