import { createFeature } from "@webiny/feature/admin";
import { WbReviewContentAdapter as AdapterAbstraction } from "./WbReviewContentAdapter/abstractions.js";
import { WbReviewRowProvider as RowProviderAbstraction } from "./WbReviewRowProvider/abstractions.js";
import { WbReviewContentAdapter } from "./WbReviewContentAdapter/WbReviewContentAdapter.js";
import { WbReviewGateway } from "./WbReviewGateway/WbReviewGateway.js";
import { WbReviewChangeMessageHandler } from "./WbReviewChangeMessageHandler.js";
import { WbReviewNotificationHandler } from "./WbReviewNotificationHandler.js";
import { WbReviewRowProvider } from "./WbReviewRowProvider/WbReviewRowProvider.js";

/*
 * The Website Builder review registrations: the review gateway under the shared
 * `ReviewAppGateway` token (R347), the content adapter, the Content Reviews row provider and the
 * two websocket handlers.
 */
export const WbReviewFeature = createFeature({
    name: "WebsiteBuilderWorkflows/Review",
    register(container) {
        container.register(WbReviewGateway).inSingletonScope();
        container.register(WbReviewContentAdapter).inSingletonScope();
        container.register(WbReviewRowProvider).inSingletonScope();
        container.register(WbReviewNotificationHandler);
        container.register(WbReviewChangeMessageHandler);
    },
    resolve(container) {
        return {
            contentAdapter: container.resolve(AdapterAbstraction),
            rowProvider: container.resolve(RowProviderAbstraction)
        };
    }
});
