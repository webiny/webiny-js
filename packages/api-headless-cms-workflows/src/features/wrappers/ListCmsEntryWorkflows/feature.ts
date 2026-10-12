import { createFeature } from "@webiny/feature/api";
import { ListCmsEntryWorkflowsUseCase } from "./ListCmsEntryWorkflowsUseCase.js";

export const ListCmsEntryWorkflowsFeature = createFeature({
    name: "CmsWorkflows/ListCmsEntryWorkflows",
    register(container) {
        container.register(ListCmsEntryWorkflowsUseCase);
    }
});
