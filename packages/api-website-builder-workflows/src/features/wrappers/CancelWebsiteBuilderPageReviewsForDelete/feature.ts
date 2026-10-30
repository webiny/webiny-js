import { createFeature } from "@webiny/feature/api";
import { CancelWebsiteBuilderPageReviewsForDeleteUseCase } from "./CancelWebsiteBuilderPageReviewsForDeleteUseCase.js";

export const CancelWebsiteBuilderPageReviewsForDeleteFeature = createFeature({
    name: "WebsiteBuilderWorkflows/CancelWebsiteBuilderPageReviewsForDelete",
    register(container) {
        container.register(CancelWebsiteBuilderPageReviewsForDeleteUseCase);
    }
});
