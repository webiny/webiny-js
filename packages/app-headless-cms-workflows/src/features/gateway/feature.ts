import { createFeature } from "@webiny/feature/admin";
import { CmsReviewRowProvider as RowProviderAbstraction } from "./CmsReviewRowProvider.js";
import { CmsReviewRowProvider } from "./CmsReviewRowProviderImpl.js";
import { CmsReviewNotificationHandler } from "./CmsReviewNotificationHandlerImpl.js";
import { CmsReviewChangeMessageHandler } from "./CmsReviewChangeMessageHandlerImpl.js";
import { CmsReviewContentAdapter as AdapterAbstraction } from "./CmsReviewContentAdapter.js";
import { CmsReviewUseCases as UseCasesAbstraction } from "./CmsReviewUseCases.js";
import { CmsReviewContentAdapter } from "./CmsReviewContentAdapterImpl.js";
import { CmsReviewGateway } from "./CmsReviewGatewayImpl.js";
import { CmsReviewUseCases } from "./CmsReviewUseCasesImpl.js";

export const CmsReviewFeature = createFeature({
    name: "CmsWorkflows/Review",
    register(container) {
        container.register(CmsReviewGateway).inSingletonScope();
        container.register(CmsReviewUseCases).inSingletonScope();
        container.register(CmsReviewContentAdapter).inSingletonScope();
        container.register(CmsReviewRowProvider).inSingletonScope();
        container.register(CmsReviewNotificationHandler);
        container.register(CmsReviewChangeMessageHandler);
    },
    resolve(container) {
        return {
            useCases: container.resolve(UseCasesAbstraction),
            contentAdapter: container.resolve(AdapterAbstraction),
            rowProvider: container.resolve(RowProviderAbstraction)
        };
    }
});
