import { createFeature } from "@webiny/feature/api";
import { GetWebsiteBuilderPageReviewStepRunUseCase } from "./GetWebsiteBuilderPageReviewStepRunUseCase.js";

export const GetWebsiteBuilderPageReviewStepRunFeature = createFeature({
    name: "WebsiteBuilderWorkflows/GetWebsiteBuilderPageReviewStepRun",
    register(container) {
        container.register(GetWebsiteBuilderPageReviewStepRunUseCase);
    }
});
