import type { ReviewListSortField } from "./abstractions.js";

// The table column each sort field belongs to (the column ids are keys of the row view model).
export const REVIEW_LIST_SORT_COLUMNS: Record<ReviewListSortField, string> = {
    title: "title",
    lastChangedOn: "lastChange"
};
