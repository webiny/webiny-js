import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types/index.js";
import type { ListPublishRow } from "@webiny/app-workflows/review/presentation/listActions/ListPublishRow.js";
import type { ICmsEntryMetaWithReview } from "~/types.js";

// What the shared publish gates need to know about an entry list row. Pure.
export const toListPublishRow = (entry: CmsContentEntry): ListPublishRow => {
    const meta: ICmsEntryMetaWithReview = entry.meta;

    return {
        reviewState: meta.system?.workflow?.reviewState ?? null,
        isPublished: meta.status === "published",
        isUnpublished: meta.status === "unpublished"
    };
};
