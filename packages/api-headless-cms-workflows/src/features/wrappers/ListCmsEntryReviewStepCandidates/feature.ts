import { createFeature } from "@webiny/feature/api";
import { ListCmsEntryReviewStepCandidatesUseCase } from "./ListCmsEntryReviewStepCandidatesUseCase.js";

export const ListCmsEntryReviewStepCandidatesFeature = createFeature({
    name: "CmsWorkflows/ListCmsEntryReviewStepCandidates",
    register(container) {
        container.register(ListCmsEntryReviewStepCandidatesUseCase);
    }
});
