import { createFeature } from "@webiny/feature/api";
import { RequestWebsiteBuilderPageReviewUseCase } from "./RequestWebsiteBuilderPageReviewUseCase.js";

export const RequestWebsiteBuilderPageReviewFeature = createFeature({
    name: "WebsiteBuilderWorkflows/RequestWebsiteBuilderPageReview",
    register(container) {
        container.register(RequestWebsiteBuilderPageReviewUseCase);
    }
});
