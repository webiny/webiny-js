import { ReviewCacheSyncHandler } from "@webiny/app-workflows/review/cache/ReviewCacheSyncHandler.js";
import { ReviewChangedHandler } from "@webiny/app-workflows/review/events/ReviewChangedHandler.js";
import { WbReviewPageCacheWriter } from "./abstractions.js";

/*
 * The shared handler is never registered itself: `createImplementation` stores the abstraction and
 * dependencies on the class, so each app subclasses it once (R237).
 */
class WbReviewCacheSyncHandlerImpl
    extends ReviewCacheSyncHandler
    implements ReviewChangedHandler.Interface {}

export const WbReviewCacheSyncHandler = ReviewChangedHandler.createImplementation({
    implementation: WbReviewCacheSyncHandlerImpl,
    dependencies: [WbReviewPageCacheWriter]
});
