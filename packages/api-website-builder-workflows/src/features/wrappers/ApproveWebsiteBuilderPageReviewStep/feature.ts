import { createFeature } from "@webiny/feature/api";
import { ApproveWebsiteBuilderPageReviewStepUseCase } from "./ApproveWebsiteBuilderPageReviewStepUseCase.js";

export const ApproveWebsiteBuilderPageReviewStepFeature = createFeature({
    name: "WebsiteBuilderWorkflows/ApproveWebsiteBuilderPageReviewStep",
    register(container) {
        container.register(ApproveWebsiteBuilderPageReviewStepUseCase);
    }
});
