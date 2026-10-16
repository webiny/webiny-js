import { createFeature } from "@webiny/feature/admin";
import { WbReviewContentAdapter as AdapterAbstraction } from "./WbReviewContentAdapter.js";
import { WbReviewUseCases as UseCasesAbstraction } from "./WbReviewUseCases.js";
import { WbReviewContentAdapter } from "./WbReviewContentAdapterImpl.js";
import { WbReviewGateway } from "./WbReviewGatewayImpl.js";
import { WbReviewUseCases } from "./WbReviewUseCasesImpl.js";

export const WbReviewFeature = createFeature({
    name: "WebsiteBuilderWorkflows/Review",
    register(container) {
        container.register(WbReviewGateway).inSingletonScope();
        container.register(WbReviewUseCases).inSingletonScope();
        container.register(WbReviewContentAdapter).inSingletonScope();
    },
    resolve(container) {
        return {
            useCases: container.resolve(UseCasesAbstraction),
            contentAdapter: container.resolve(AdapterAbstraction)
        };
    }
});
