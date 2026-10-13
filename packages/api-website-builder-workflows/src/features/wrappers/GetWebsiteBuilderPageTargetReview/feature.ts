import { createFeature } from "@webiny/feature/api";
import { GetWebsiteBuilderPageTargetReviewUseCase } from "./GetWebsiteBuilderPageTargetReviewUseCase.js";

export const GetWebsiteBuilderPageTargetReviewFeature = createFeature({
    name: "WebsiteBuilderWorkflows/GetWebsiteBuilderPageTargetReview",
    register(container) {
        container.register(GetWebsiteBuilderPageTargetReviewUseCase);
    }
});
