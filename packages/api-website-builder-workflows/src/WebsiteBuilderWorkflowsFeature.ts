import { type Container, createFeature } from "@webiny/feature/api";
import { PageWorkflowsFeature } from "./features/PageWorkflows/feature.js";
import { WebsiteBuilderPageSchemaFactory } from "./WebsiteBuilderPageSchemaFactory.js";

export const WebsiteBuilderWorkflowsFeature = createFeature({
    name: "WebsiteBuilderWorkflows",
    register(container: Container) {
        // Page workflow handlers/decorators are register-time-safe and inert without workflow state
        // (no license → no workflow states), so register unconditionally — matching CmsWorkflowsFeature.
        // The WbPage.system schema extension is WCP-gated inside WebsiteBuilderPageSchemaFactory.
        PageWorkflowsFeature.register(container);
        container.register(WebsiteBuilderPageSchemaFactory);
    }
});
