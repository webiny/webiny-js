import { WebsocketEventHandler } from "@webiny/app-websockets/events/abstractions.js";
import { ReviewActivity } from "@webiny/app-workflows/review/activity/abstractions.js";
import { ReviewChangeMessageHandler } from "@webiny/app-workflows/review/mounting/ReviewChangeMessageHandler.js";
import { CmsReviewContentAdapter } from "./CmsReviewContentAdapter/abstractions.js";

// A subclass of its own (see CmsReviewNotificationHandlerImpl): the Website Builder binds its own.
class CmsReviewChangeMessageHandlerImpl
    extends ReviewChangeMessageHandler
    implements WebsocketEventHandler.Interface {}

export const CmsReviewChangeMessageHandler = WebsocketEventHandler.createImplementation({
    implementation: CmsReviewChangeMessageHandlerImpl,
    dependencies: [ReviewActivity, CmsReviewContentAdapter]
});
