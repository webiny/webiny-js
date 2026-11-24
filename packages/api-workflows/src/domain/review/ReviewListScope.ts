/**
 * Whose reviews a list shows (spec 11, B2 design 1): the "who" half of a list filter. `all` is open
 * to everyone (B7): every readable review for a viewer with `reassign`, else every readable review
 * that involves the viewer (requester, a current candidate team, or the owner of a step).
 */
export type ReviewListScope = "assignedToMe" | "pool" | "teamInReview" | "myRequests" | "all";
