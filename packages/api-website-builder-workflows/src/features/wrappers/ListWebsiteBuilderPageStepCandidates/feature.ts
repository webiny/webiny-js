import { createFeature } from "@webiny/feature/api";
import { ListWebsiteBuilderPageStepCandidatesUseCase } from "./ListWebsiteBuilderPageStepCandidatesUseCase.js";

export const ListWebsiteBuilderPageStepCandidatesFeature = createFeature({
    name: "WebsiteBuilderWorkflows/ListWebsiteBuilderPageStepCandidates",
    register(container) {
        container.register(ListWebsiteBuilderPageStepCandidatesUseCase);
    }
});
