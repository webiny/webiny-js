import { createFeature } from "@webiny/feature/api";
import { GetWebsiteBuilderPageWorkflowUseCase } from "./GetWebsiteBuilderPageWorkflowUseCase.js";

export const GetWebsiteBuilderPageWorkflowFeature = createFeature({
    name: "WebsiteBuilderWorkflows/GetWebsiteBuilderPageWorkflow",
    register(container) {
        container.register(GetWebsiteBuilderPageWorkflowUseCase);
    }
});
