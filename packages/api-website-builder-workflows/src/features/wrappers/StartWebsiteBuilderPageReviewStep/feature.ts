import { createFeature } from "@webiny/feature/api";
import { StartWebsiteBuilderPageReviewStepUseCase } from "./StartWebsiteBuilderPageReviewStepUseCase.js";

export const StartWebsiteBuilderPageReviewStepFeature = createFeature({
    name: "WebsiteBuilderWorkflows/StartWebsiteBuilderPageReviewStep",
    register(container) {
        container.register(StartWebsiteBuilderPageReviewStepUseCase);
    }
});
