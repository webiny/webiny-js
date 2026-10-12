import { createFeature } from "@webiny/feature/api";
import { ListWebsiteBuilderPageWorkflowsUseCase } from "./ListWebsiteBuilderPageWorkflowsUseCase.js";

export const ListWebsiteBuilderPageWorkflowsFeature = createFeature({
    name: "WebsiteBuilderWorkflows/ListWebsiteBuilderPageWorkflows",
    register(container) {
        container.register(ListWebsiteBuilderPageWorkflowsUseCase);
    }
});
