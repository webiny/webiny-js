import type { DataTableSorting } from "@webiny/admin-ui";
import type { ReviewListSort } from "~/review/domain/ReviewListSort.js";
import type { ReviewListSortField } from "./abstractions.js";
import { REVIEW_LIST_SORT_COLUMNS } from "./reviewListSortColumns.js";

// The list's one sort as the table's sorting state: exactly one sorted column.
export const toReviewListTableSorting = (sort: ReviewListSort): DataTableSorting => {
    const [field, direction] = sort.split("_") as [ReviewListSortField, string];
    return [{ id: REVIEW_LIST_SORT_COLUMNS[field], desc: direction === "DESC" }];
};
