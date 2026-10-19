import { createFeature } from "@webiny/feature/admin";
import { WbReviewCacheSyncHandler } from "./WbReviewCacheSyncHandler.js";
import { WbReviewPageCacheWriter } from "./WbReviewPageCacheWriter.js";

export const WbReviewCacheFeature = createFeature({
    name: "WebsiteBuilder/Workflows/ReviewCache",
    register(container) {
        container.register(WbReviewPageCacheWriter).inSingletonScope();
        container.register(WbReviewCacheSyncHandler);
    }
});
