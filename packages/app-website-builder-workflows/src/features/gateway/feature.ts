import { createFeature } from "@webiny/feature/admin";
import { WbReviewContentAdapter as AdapterAbstraction } from "./WbReviewContentAdapter/abstractions.js";
import { WbReviewUseCases as UseCasesAbstraction } from "./WbReviewUseCases/abstractions.js";
import { WbReviewRowProvider as RowProviderAbstraction } from "./WbReviewRowProvider/abstractions.js";
import { WbReviewContentAdapter } from "./WbReviewContentAdapter/WbReviewContentAdapter.js";
import { WbReviewAppGateway } from "./WbReviewAppGateway/WbReviewAppGateway.js";
import { WbReviewGateway } from "./WbReviewGateway/WbReviewGateway.js";
import { WbReviewChangeMessageHandler } from "./WbReviewChangeMessageHandler.js";
import { WbReviewNotificationHandler } from "./WbReviewNotificationHandler.js";
import { WbReviewRowProvider } from "./WbReviewRowProvider/WbReviewRowProvider.js";
import { WbReviewUseCases } from "./WbReviewUseCases/WbReviewUseCases.js";

export const WbReviewFeature = createFeature({
    name: "WebsiteBuilderWorkflows/Review",
    register(container) {
        container.register(WbReviewGateway).inSingletonScope();
        container.register(WbReviewAppGateway).inSingletonScope();
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
