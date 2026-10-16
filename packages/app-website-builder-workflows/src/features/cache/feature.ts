import { createFeature } from "@webiny/feature/admin";
import { WbReviewCacheSyncHandler } from "./WbReviewCacheSyncHandlerImpl.js";
import { WbReviewPageCacheWriter } from "./WbReviewPageCacheWriterImpl.js";

export const WbReviewCacheFeature = createFeature({
    name: "WebsiteBuilder/Workflows/ReviewCache",
    register(container) {
        container.register(WbReviewPageCacheWriter).inSingletonScope();
        container.register(WbReviewCacheSyncHandler);
    }
});
