import { createFeature } from "@webiny/feature/api";
import { ListCmsEntryWorkflowModelsUseCase } from "./ListCmsEntryWorkflowModelsUseCase.js";

export const ListCmsEntryWorkflowModelsFeature = createFeature({
    name: "CmsWorkflows/ListCmsEntryWorkflowModels",
    register(container) {
        container.register(ListCmsEntryWorkflowModelsUseCase);
    }
});
