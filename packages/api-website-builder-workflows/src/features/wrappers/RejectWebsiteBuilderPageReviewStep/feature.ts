import { createFeature } from "@webiny/feature/api";
import { RejectWebsiteBuilderPageReviewStepUseCase } from "./RejectWebsiteBuilderPageReviewStepUseCase.js";

export const RejectWebsiteBuilderPageReviewStepFeature = createFeature({
    name: "WebsiteBuilderWorkflows/RejectWebsiteBuilderPageReviewStep",
    register(container) {
        container.register(RejectWebsiteBuilderPageReviewStepUseCase);
    }
});
