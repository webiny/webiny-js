import { createFeature } from "@webiny/feature/admin";
import { CmsReviewCacheSyncHandler } from "./cache/CmsReviewCacheSyncHandler.js";
import { CmsReviewCacheWriter } from "./cache/CmsReviewCacheWriter.js";
import { CmsReviewEntriesCacheProviderDecorator } from "./cache/CmsReviewEntriesCacheProviderDecorator.js";

export const CmsWorkflowsCacheFeature = createFeature({
    name: "CmsWorkflows/Cache",
    register(container) {
        container.register(CmsReviewCacheWriter);
        container.register(CmsReviewCacheSyncHandler);
        container.registerDecorator(CmsReviewEntriesCacheProviderDecorator);
    }
});
