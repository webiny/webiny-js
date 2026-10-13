import { createFeature } from "@webiny/feature/api";
import { ListWebsiteBuilderPageReviewsUseCase } from "./ListWebsiteBuilderPageReviewsUseCase.js";

export const ListWebsiteBuilderPageReviewsFeature = createFeature({
    name: "WebsiteBuilderWorkflows/ListWebsiteBuilderPageReviews",
    register(container) {
        container.register(ListWebsiteBuilderPageReviewsUseCase);
    }
});
