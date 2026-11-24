/**
 * Where the listed reviews are (B2 design 1): the "where" half of a list filter, on every scope.
 * `inReview` and `failed` are in-progress reviews whose current step did not or did fail.
 */
export type ReviewListState = "all" | "inReview" | "failed" | "approved" | "rejected";
