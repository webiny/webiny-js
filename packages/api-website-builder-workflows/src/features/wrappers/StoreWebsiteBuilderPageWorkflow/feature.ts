import { createFeature } from "@webiny/feature/api";
import { StoreWebsiteBuilderPageWorkflowUseCase } from "./StoreWebsiteBuilderPageWorkflowUseCase.js";

export const StoreWebsiteBuilderPageWorkflowFeature = createFeature({
    name: "WebsiteBuilderWorkflows/StoreWebsiteBuilderPageWorkflow",
    register(container) {
        container.register(StoreWebsiteBuilderPageWorkflowUseCase);
    }
});
