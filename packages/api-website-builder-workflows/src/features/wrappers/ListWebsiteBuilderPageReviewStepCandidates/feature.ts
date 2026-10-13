import { createFeature } from "@webiny/feature/api";
import { ListWebsiteBuilderPageReviewStepCandidatesUseCase } from "./ListWebsiteBuilderPageReviewStepCandidatesUseCase.js";

export const ListWebsiteBuilderPageReviewStepCandidatesFeature = createFeature({
    name: "WebsiteBuilderWorkflows/ListWebsiteBuilderPageReviewStepCandidates",
    register(container) {
        container.register(ListWebsiteBuilderPageReviewStepCandidatesUseCase);
    }
});
