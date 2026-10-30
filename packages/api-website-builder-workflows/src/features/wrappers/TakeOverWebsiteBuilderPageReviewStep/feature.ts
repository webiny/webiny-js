import { createFeature } from "@webiny/feature/api";
import { TakeOverWebsiteBuilderPageReviewStepUseCase } from "./TakeOverWebsiteBuilderPageReviewStepUseCase.js";

export const TakeOverWebsiteBuilderPageReviewStepFeature = createFeature({
    name: "WebsiteBuilderWorkflows/TakeOverWebsiteBuilderPageReviewStep",
    register(container) {
        container.register(TakeOverWebsiteBuilderPageReviewStepUseCase);
    }
});
