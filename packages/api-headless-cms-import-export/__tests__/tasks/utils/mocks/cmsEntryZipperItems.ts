import { ICmsEntryFetcherResult } from "~/tasks/utils";
import { CmsEntry } from "@webiny/api-headless-cms/types";

export const createEntries = (): CmsEntry[] => {
    return [
        {
            id: "1"
        },
        {
            id: "2"
        },
        {
            id: "3"
        },
        {
            id: "4"
        },
        {
            id: "5"
        },
        {
            id: "6"
        },
        {
            id: "7"
        },
        {
            id: "8"
        }
    ] as CmsEntry[];
};

export const fetchItems = (after?: string | null): ICmsEntryFetcherResult => {
    const entries = createEntries();

    if (!after) {
        const items = entries.slice(0, 2);
        return {
            items,
            meta: {
                totalCount: createEntries().length,
                cursor: items[items.length - 1]?.id || null,
                hasMoreItems: true
            }
        } as ICmsEntryFetcherResult;
    }

    const index = entries.findIndex(item => item.id === after);
    if (index > -1) {
        const items = entries.slice(index + 1, index + 3);
        return {
            items,
            meta: {
                totalCount: createEntries().length,
                cursor: items[items.length - 1]?.id || null,
                hasMoreItems: index + 3 < entries.length
            }
        } as ICmsEntryFetcherResult;
    }
    return {
        items: [],
        meta: {
            totalCount: 0,
            cursor: null,
            hasMoreItems: false
        }
    } as ICmsEntryFetcherResult;
};
