import { createFeature } from "@webiny/feature/api";
import { DeleteWebsiteBuilderPageWorkflowUseCase } from "./DeleteWebsiteBuilderPageWorkflowUseCase.js";

export const DeleteWebsiteBuilderPageWorkflowFeature = createFeature({
    name: "WebsiteBuilderWorkflows/DeleteWebsiteBuilderPageWorkflow",
    register(container) {
        container.register(DeleteWebsiteBuilderPageWorkflowUseCase);
    }
});
