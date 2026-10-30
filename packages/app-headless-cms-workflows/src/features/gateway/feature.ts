import { createFeature } from "@webiny/feature/admin";
import { CmsReviewRowProvider as RowProviderAbstraction } from "./CmsReviewRowProvider/abstractions.js";
import { CmsReviewRowProvider } from "./CmsReviewRowProvider/CmsReviewRowProvider.js";
import { CmsReviewNotificationHandler } from "./CmsReviewNotificationHandler.js";
import { CmsReviewChangeMessageHandler } from "./CmsReviewChangeMessageHandler.js";
import { CmsReviewContentAdapter as AdapterAbstraction } from "./CmsReviewContentAdapter/abstractions.js";
import { CmsReviewContentAdapter } from "./CmsReviewContentAdapter/CmsReviewContentAdapter.js";
import { CmsReviewGateway } from "./CmsReviewGateway/CmsReviewGateway.js";

/*
 * The CMS review registrations: the review gateway under the shared `ReviewAppGateway` token
 * (R347), the content adapter, the Content Reviews row provider and the two websocket handlers.
 */
export const CmsReviewFeature = createFeature({
    name: "CmsWorkflows/Review",
    register(container) {
        container.register(CmsReviewGateway).inSingletonScope();
        container.register(CmsReviewContentAdapter).inSingletonScope();
        container.register(CmsReviewRowProvider).inSingletonScope();
        container.register(CmsReviewNotificationHandler);
        container.register(CmsReviewChangeMessageHandler);
    },
    resolve(container) {
        return {
            contentAdapter: container.resolve(AdapterAbstraction),
            rowProvider: container.resolve(RowProviderAbstraction)
        };
    }
});
