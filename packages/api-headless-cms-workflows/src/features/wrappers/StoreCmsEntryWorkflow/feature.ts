import { createFeature } from "@webiny/feature/api";
import { StoreCmsEntryWorkflowUseCase } from "./StoreCmsEntryWorkflowUseCase.js";

export const StoreCmsEntryWorkflowFeature = createFeature({
    name: "CmsWorkflows/StoreCmsEntryWorkflow",
    register(container) {
        container.register(StoreCmsEntryWorkflowUseCase);
    }
});
