import { createFeature } from "@webiny/feature/api";
import { ReassignWebsiteBuilderPageReviewStepUseCase } from "./ReassignWebsiteBuilderPageReviewStepUseCase.js";

export const ReassignWebsiteBuilderPageReviewStepFeature = createFeature({
    name: "WebsiteBuilderWorkflows/ReassignWebsiteBuilderPageReviewStep",
    register(container) {
        container.register(ReassignWebsiteBuilderPageReviewStepUseCase);
    }
});
