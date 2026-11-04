import { createFeature } from "@webiny/feature/api";
import { GetCmsEntryWorkflowUseCase } from "./GetCmsEntryWorkflowUseCase.js";

export const GetCmsEntryWorkflowFeature = createFeature({
    name: "CmsWorkflows/GetCmsEntryWorkflow",
    register(container) {
        container.register(GetCmsEntryWorkflowUseCase);
    }
});
