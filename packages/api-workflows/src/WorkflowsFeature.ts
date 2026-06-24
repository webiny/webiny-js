import { type Container, createFeature } from "@webiny/feature/api";
import { WorkflowsContextEnhancer } from "./WorkflowsContextEnhancer.js";
import { WorkflowsSchemaFactory } from "./WorkflowsSchemaFactory.js";

export const WorkflowsFeature = createFeature({
    name: "Workflows",
    register(container: Container) {
        container.register(WorkflowsContextEnhancer);
        container.register(WorkflowsSchemaFactory);
    }
});
