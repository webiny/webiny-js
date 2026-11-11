import { createFeature } from "@webiny/feature/api";
import { CancelWebsiteBuilderPageReviewUseCase } from "./CancelWebsiteBuilderPageReviewUseCase.js";

export const CancelWebsiteBuilderPageReviewFeature = createFeature({
    name: "WebsiteBuilderWorkflows/CancelWebsiteBuilderPageReview",
    register(container) {
        container.register(CancelWebsiteBuilderPageReviewUseCase);
    }
});
