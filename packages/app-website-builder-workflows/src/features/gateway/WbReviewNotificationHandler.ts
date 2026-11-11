import { WebsocketEventHandler } from "@webiny/app-websockets/events/abstractions.js";
import { ReviewNotificationHandler } from "@webiny/app-workflows/review/mounting/ReviewNotificationHandler.js";
import { ReviewNotificationService } from "@webiny/app-workflows/review/notifications/abstractions.js";
import { WbReviewContentAdapter } from "./WbReviewContentAdapter/abstractions.js";

// A subclass of its own (see WbReviewRowProviderImpl): the CMS binds its own.
class WbReviewNotificationHandlerImpl
    extends ReviewNotificationHandler
    implements WebsocketEventHandler.Interface {}

export const WbReviewNotificationHandler = WebsocketEventHandler.createImplementation({
    implementation: WbReviewNotificationHandlerImpl,
    dependencies: [ReviewNotificationService, WbReviewContentAdapter]
});
