import { decodeCursor, encodeCursor } from "~/utils/cursor";

interface MetaResponse {
    cursor: string | null;
    totalCount: number;
    hasMoreItems: boolean;
}

interface CreateListResponseParams<T> {
    items: T[];
    after?: string | null;
    totalCount: number;
    limit: number;
}

export function createListResponse<T>(params: CreateListResponseParams<T>): [T[], MetaResponse] {
    const { items: initialItems, after, totalCount, limit } = params;
    let start = Number(decodeCursor(after));
    if (isNaN(start) === true) {
        start = 0;
    }
    const hasMoreItems = totalCount > start + limit;
    const end = limit > totalCount + start + limit ? undefined : start + limit;
    const items = end ? initialItems.slice(start, end) : initialItems;

    const cursor = items.length > 0 ? encodeCursor(start + limit) : null;

    const meta = {
        hasMoreItems,
        totalCount,
        cursor
    };

    return [items, meta];
}
