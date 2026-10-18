import { createFeature } from "@webiny/feature/admin";
import { WbReviewContentAdapter as AdapterAbstraction } from "./WbReviewContentAdapter.js";
import { WbReviewUseCases as UseCasesAbstraction } from "./WbReviewUseCases.js";
import { WbReviewRowProvider as RowProviderAbstraction } from "./WbReviewRowProvider.js";
import { WbReviewContentAdapter } from "./WbReviewContentAdapterImpl.js";
import { WbReviewGateway } from "./WbReviewGatewayImpl.js";
import { WbReviewChangeMessageHandler } from "./WbReviewChangeMessageHandlerImpl.js";
import { WbReviewNotificationHandler } from "./WbReviewNotificationHandlerImpl.js";
import { WbReviewRowProvider } from "./WbReviewRowProviderImpl.js";
import { WbReviewUseCases } from "./WbReviewUseCasesImpl.js";

export const WbReviewFeature = createFeature({
    name: "WebsiteBuilderWorkflows/Review",
    register(container) {
        container.register(WbReviewGateway).inSingletonScope();
        container.register(WbReviewUseCases).inSingletonScope();
        container.register(WbReviewContentAdapter).inSingletonScope();
        container.register(WbReviewRowProvider).inSingletonScope();
        container.register(WbReviewNotificationHandler);
        container.register(WbReviewChangeMessageHandler);
    },
    resolve(container) {
        return {
            useCases: container.resolve(UseCasesAbstraction),
            contentAdapter: container.resolve(AdapterAbstraction),
            rowProvider: container.resolve(RowProviderAbstraction)
        };
    }
});
