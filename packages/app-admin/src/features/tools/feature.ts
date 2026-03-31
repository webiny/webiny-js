import { createFeature } from "@webiny/feature/admin";
import { Container } from "@webiny/di";
import {
    ToolRegistry as ToolRegistryAbstraction,
    PipelineRunner as PipelineRunnerAbstraction
} from "./abstractions.js";
import { ToolRegistry } from "./ToolRegistry.js";
import { ToolPipelineRunner } from "./ToolPipelineRunner.js";

export const ToolsFeature = createFeature({
    name: "ToolsFeature",
    register(container: Container) {
        container.register(ToolRegistry);
        container.register(ToolPipelineRunner);
    },
    resolve(container: Container) {
        return {
            toolRegistry: container.resolve(ToolRegistryAbstraction),
            pipelineRunner: container.resolve(PipelineRunnerAbstraction)
        };
    }
});
