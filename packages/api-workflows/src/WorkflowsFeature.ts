import { type Container, createFeature } from "@webiny/feature/api";
import { WorkflowsInitializer } from "./WorkflowsInitializer.js";
import { WorkflowsSchemaFactory } from "./WorkflowsSchemaFactory.js";

export const WorkflowsFeature = createFeature({
    name: "Workflows",
    register(container: Container) {
        container.register(WorkflowsInitializer);
        container.register(WorkflowsSchemaFactory);
    }
});
