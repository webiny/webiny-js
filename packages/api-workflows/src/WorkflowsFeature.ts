import { type Container, createFeature } from "@webiny/feature/api";
import { registerLegacyPluginsViaGqlContextEnhancer } from "@webiny/handler-graphql";
import { createWorkflows } from "./index.js";
import { WorkflowModel } from "./domain/workflow/workflowModel.js";
import { WorkflowStateModel } from "./domain/workflowState/stateModel.js";

export const WorkflowsFeature = createFeature({
    name: "Workflows",
    register(container: Container) {
        container.register(WorkflowModel);
        container.register(WorkflowStateModel);
        registerLegacyPluginsViaGqlContextEnhancer(container, [...createWorkflows()]);
    }
});
