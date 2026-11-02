import type { IListCache } from "@webiny/app-admin/features/listCache/index.js";
import { ContentEntriesCacheProvider } from "@webiny/app-headless-cms/features/contentEntry/abstractions.js";
import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types/index.js";
import { ReviewPreservingEntriesCache } from "./ReviewPreservingEntriesCache.js";

class CmsReviewEntriesCacheProvider implements ContentEntriesCacheProvider.Interface {
    constructor(private readonly decoratee: ContentEntriesCacheProvider.Interface) {}

    get(modelId: string): IListCache<CmsContentEntry> {
        return new ReviewPreservingEntriesCache(this.decoratee.get(modelId));
    }
}

export const CmsReviewEntriesCacheProviderDecorator = ContentEntriesCacheProvider.createDecorator({
    decorator: CmsReviewEntriesCacheProvider,
    dependencies: []
});
