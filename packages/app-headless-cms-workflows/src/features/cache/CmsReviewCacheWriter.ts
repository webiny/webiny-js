import { ContentEntriesCacheProvider } from "@webiny/app-headless-cms/features/contentEntry/abstractions.js";
import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types/index.js";
import type { ReviewCacheRef } from "@webiny/app-workflows/review/cache/IReviewCacheWriter.js";
import type { SystemWorkflowValue } from "@webiny/app-workflows/review/domain/types.js";
import { isCmsAppName } from "~/utils/appName.js";
import { parseAppName } from "~/utils/appName.js";
import type { ICmsEntryMetaWithReview } from "~/types.js";
import { CmsReviewCacheWriter as Abstraction } from "./abstractions.js";

class CmsReviewCacheWriterImpl implements Abstraction.Interface {
    constructor(private readonly cacheProvider: ContentEntriesCacheProvider.Interface) {}

    canHandle(namespace: string): boolean {
        return isCmsAppName(namespace);
    }

    write(ref: ReviewCacheRef, workflow: SystemWorkflowValue | null): void {
        const modelId = parseAppName(ref.namespace);
        const cache = this.cacheProvider.get(modelId);

        cache.updateItems((entry: CmsContentEntry) => {
            // Only the revision the review belongs to is updated, never a newer one.
            if (entry.id !== ref.targetRevisionId) {
                return entry;
            }

            const current: ICmsEntryMetaWithReview = entry.meta;
            const meta: ICmsEntryMetaWithReview = {
                ...entry.meta,
                system: { ...current.system, workflow }
            };

            return { ...entry, meta };
        });
    }
}

export const CmsReviewCacheWriter = Abstraction.createImplementation({
    implementation: CmsReviewCacheWriterImpl,
    dependencies: [ContentEntriesCacheProvider]
});
