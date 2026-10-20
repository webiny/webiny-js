import { createFeature } from "@webiny/feature/api";
import { DeleteCmsEntryWorkflowUseCase } from "./DeleteCmsEntryWorkflowUseCase.js";

export const DeleteCmsEntryWorkflowFeature = createFeature({
    name: "CmsWorkflows/DeleteCmsEntryWorkflow",
    register(container) {
        container.register(DeleteCmsEntryWorkflowUseCase);
    }
});
