import { createFeature } from "@webiny/feature/api";
import { ListCmsEntryStepCandidatesUseCase } from "./ListCmsEntryStepCandidatesUseCase.js";

export const ListCmsEntryStepCandidatesFeature = createFeature({
    name: "CmsWorkflows/ListCmsEntryStepCandidates",
    register(container) {
        container.register(ListCmsEntryStepCandidatesUseCase);
    }
});
