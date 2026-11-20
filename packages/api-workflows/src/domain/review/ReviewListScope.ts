/**
 * Whose reviews a list shows (spec 11, B2 design 1): the "who" half of a list filter. `all` is every
 * review the viewer can read; the app wrappers limit it to viewers with `reassign`.
 */
export type ReviewListScope = "assignedToMe" | "pool" | "teamInReview" | "myRequests" | "all";
