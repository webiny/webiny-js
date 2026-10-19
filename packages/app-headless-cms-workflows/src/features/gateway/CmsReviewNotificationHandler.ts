import { WebsocketEventHandler } from "@webiny/app-websockets/events/abstractions.js";
import { ReviewNotificationHandler } from "@webiny/app-workflows/review/mounting/ReviewNotificationHandler.js";
import { ReviewNotificationService } from "@webiny/app-workflows/review/notifications/abstractions.js";
import { CmsReviewContentAdapter } from "./CmsReviewContentAdapter/abstractions.js";

// A subclass of its own (see CmsReviewRowProviderImpl): the Website Builder binds its own.
class CmsReviewNotificationHandlerImpl
    extends ReviewNotificationHandler
    implements WebsocketEventHandler.Interface {}

export const CmsReviewNotificationHandler = WebsocketEventHandler.createImplementation({
    implementation: CmsReviewNotificationHandlerImpl,
    dependencies: [ReviewNotificationService, CmsReviewContentAdapter]
});
