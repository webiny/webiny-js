import { createFeature } from "@webiny/feature/api";
import { GetWebsiteBuilderPageReviewUseCase } from "./GetWebsiteBuilderPageReviewUseCase.js";

export const GetWebsiteBuilderPageReviewFeature = createFeature({
    name: "WebsiteBuilderWorkflows/GetWebsiteBuilderPageReview",
    register(container) {
        container.register(GetWebsiteBuilderPageReviewUseCase);
    }
});
