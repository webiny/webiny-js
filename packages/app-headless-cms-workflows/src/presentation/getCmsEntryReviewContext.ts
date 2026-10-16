import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types/index.js";
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";
import type { TargetReviewContext } from "@webiny/app-workflows/review/presentation/targetReview/abstractions.js";

export function getCmsEntryReviewContext(
    model: CmsModel,
    entry: CmsContentEntry,
    canRequest: boolean
): TargetReviewContext {
    const entryTitle = entry.meta?.title || "unknown";

    return {
        targetTitle: `${model.name}: ${entryTitle}`,
        canRequest,
        isPublished: entry.meta?.status === "published",
        // A revision published before and not published now (R226): it was reviewed before.
        isUnpublished: entry.meta?.status === "unpublished"
    };
}
