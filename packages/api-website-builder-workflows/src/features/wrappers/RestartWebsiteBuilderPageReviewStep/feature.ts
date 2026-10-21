import { createFeature } from "@webiny/feature/api";
import { RestartWebsiteBuilderPageReviewStepUseCase } from "./RestartWebsiteBuilderPageReviewStepUseCase.js";

export const RestartWebsiteBuilderPageReviewStepFeature = createFeature({
    name: "WebsiteBuilderWorkflows/RestartWebsiteBuilderPageReviewStep",
    register(container) {
        container.register(RestartWebsiteBuilderPageReviewStepUseCase);
    }
});
