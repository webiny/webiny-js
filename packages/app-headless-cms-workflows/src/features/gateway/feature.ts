import { createFeature } from "@webiny/feature/admin";
import { CmsReviewRowProvider as RowProviderAbstraction } from "./CmsReviewRowProvider/abstractions.js";
import { CmsReviewRowProvider } from "./CmsReviewRowProvider/CmsReviewRowProvider.js";
import { CmsReviewNotificationHandler } from "./CmsReviewNotificationHandler.js";
import { CmsReviewChangeMessageHandler } from "./CmsReviewChangeMessageHandler.js";
import { CmsReviewContentAdapter as AdapterAbstraction } from "./CmsReviewContentAdapter/abstractions.js";
import { CmsReviewContentAdapter } from "./CmsReviewContentAdapter/CmsReviewContentAdapter.js";
import { CmsReviewAppGateway } from "./CmsReviewAppGateway/CmsReviewAppGateway.js";
import { CmsReviewGateway } from "./CmsReviewGateway/CmsReviewGateway.js";
import { CmsReviewUseCases } from "./CmsReviewUseCases/CmsReviewUseCases.js";

export const CmsReviewFeature = createFeature({
    name: "CmsWorkflows/Review",
    register(container) {
        container.register(CmsReviewGateway).inSingletonScope();
        container.register(CmsReviewAppGateway).inSingletonScope();
        container.register(CmsReviewUseCases).inSingletonScope();
        container.register(CmsReviewContentAdapter).inSingletonScope();
        container.register(CmsReviewRowProvider).inSingletonScope();
        container.register(CmsReviewNotificationHandler);
        container.register(CmsReviewChangeMessageHandler);
    },
    // Resolved in the plugin pass, so it resolves no use case (R349, R354).
    resolve(container) {
        return {
            contentAdapter: container.resolve(AdapterAbstraction),
            rowProvider: container.resolve(RowProviderAbstraction)
        };
    }
});
