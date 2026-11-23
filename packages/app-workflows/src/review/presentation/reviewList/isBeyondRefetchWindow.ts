import type { ReviewListSort } from "~/review/domain/ReviewListSort.js";
import type { ReviewListRow } from "~/review/domain/types.js";

// The title as the server sorts it, near enough: trimmed and lower-cased.
const toTitleKey = (row: ReviewListRow): string => {
    return row.title.trim().toLocaleLowerCase();
};

/*
 * Whether a row sorts after the last row a refetch returned. When the server says it has more,
 * such a row is not gone, the window just did not reach it. Equal values count as beyond (the row
 * stays rather than fading by mistake). Without a last row (an empty page that still has more)
 * nothing can be told, so the row is kept.
 */
export const isBeyondRefetchWindow = (
    row: ReviewListRow,
    lastReturned: ReviewListRow | null,
    sort: ReviewListSort
): boolean => {
    if (!lastReturned) {
        return true;
    }

    if (sort === "title_ASC") {
        return toTitleKey(row) >= toTitleKey(lastReturned);
    }
    if (sort === "title_DESC") {
        return toTitleKey(row) <= toTitleKey(lastReturned);
    }
    const rowTime = new Date(row.lastChangedOn).getTime();
    const lastTime = new Date(lastReturned.lastChangedOn).getTime();
    if (sort === "lastChangedOn_ASC") {
        return rowTime >= lastTime;
    }
    return rowTime <= lastTime;
};
