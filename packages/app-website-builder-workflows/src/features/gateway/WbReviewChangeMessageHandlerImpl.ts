import { WebsocketEventHandler } from "@webiny/app-websockets/events/abstractions.js";
import { ReviewActivity } from "@webiny/app-workflows/review/activity/abstractions.js";
import { ReviewChangeMessageHandler } from "@webiny/app-workflows/review/mounting/ReviewChangeMessageHandler.js";
import { WbReviewContentAdapter } from "./WbReviewContentAdapter.js";

// A subclass of its own (see WbReviewNotificationHandlerImpl): the CMS binds its own.
class WbReviewChangeMessageHandlerImpl
    extends ReviewChangeMessageHandler
    implements WebsocketEventHandler.Interface {}

export const WbReviewChangeMessageHandler = WebsocketEventHandler.createImplementation({
    implementation: WbReviewChangeMessageHandlerImpl,
    dependencies: [ReviewActivity, WbReviewContentAdapter]
});
