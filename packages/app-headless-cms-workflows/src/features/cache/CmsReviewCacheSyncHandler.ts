import { ReviewCacheSyncHandler } from "@webiny/app-workflows/review/cache/ReviewCacheSyncHandler.js";
import { ReviewChangedHandler } from "@webiny/app-workflows/review/events/ReviewChangedHandler.js";
import { CmsReviewCacheWriter } from "./abstractions.js";

/*
 * The shared handler is never registered itself: `createImplementation` stores the abstraction and
 * dependencies on the class, so each app subclasses it once (R237).
 */
class CmsReviewCacheSyncHandlerImpl
    extends ReviewCacheSyncHandler
    implements ReviewChangedHandler.Interface {}

export const CmsReviewCacheSyncHandler = ReviewChangedHandler.createImplementation({
    implementation: CmsReviewCacheSyncHandlerImpl,
    dependencies: [CmsReviewCacheWriter]
});
