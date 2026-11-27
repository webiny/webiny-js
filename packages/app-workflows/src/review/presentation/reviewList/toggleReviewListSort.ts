import type { ReviewListSort } from "~/review/domain/ReviewListSort.js";
import type { ReviewListSortField } from "./abstractions.js";

const ASCENDING: Record<ReviewListSortField, ReviewListSort> = {
    title: "title_ASC",
    lastChangedOn: "lastChangedOn_ASC"
};

const DESCENDING: Record<ReviewListSortField, ReviewListSort> = {
    title: "title_DESC",
    lastChangedOn: "lastChangedOn_DESC"
};

// One sort at a time: the active field flips its direction, another field starts ascending.
export const toggleReviewListSort = (
    sort: ReviewListSort,
    field: ReviewListSortField
): ReviewListSort => {
    if (sort === ASCENDING[field]) {
        return DESCENDING[field];
    }
    return ASCENDING[field];
};
