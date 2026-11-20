import type { DataTableSorting } from "@webiny/admin-ui";
import type { ReviewListSortField } from "./abstractions.js";
import { REVIEW_LIST_SORT_COLUMNS } from "./reviewListSortColumns.js";

const FIELDS = Object.keys(REVIEW_LIST_SORT_COLUMNS) as ReviewListSortField[];

/*
 * The field whose header was clicked, read from the table's next sorting state: a column that was
 * not sorted before, else the sorted one (its direction flipped). The table's own direction is not
 * used: the list toggles it itself, one sort at a time.
 */
export const getClickedReviewListSortField = (
    current: DataTableSorting,
    next: DataTableSorting
): ReviewListSortField | null => {
    const activeColumn = current[0]?.id;
    const nextColumns = next.map(sort => sort.id);
    const column = nextColumns.find(id => id !== activeColumn) ?? activeColumn;

    return FIELDS.find(field => REVIEW_LIST_SORT_COLUMNS[field] === column) ?? null;
};
