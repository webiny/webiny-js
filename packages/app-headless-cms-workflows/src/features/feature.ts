import { createFeature } from "@webiny/feature/admin";
import { CmsReviewCacheSyncHandler } from "./cache/CmsReviewCacheSyncHandlerImpl.js";
import { CmsReviewCacheWriter } from "./cache/CmsReviewCacheWriterImpl.js";

export const CmsWorkflowsCacheFeature = createFeature({
    name: "CmsWorkflows/Cache",
    register(container) {
        container.register(CmsReviewCacheWriter);
        container.register(CmsReviewCacheSyncHandler);
    }
});
