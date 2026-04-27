import { createFeature } from "@webiny/feature/admin";
import { Container } from "@webiny/di";
import {
    ToolRegistry as ToolRegistryAbstraction,
    ToolPipelineRunner as PipelineRunnerAbstraction
} from "./abstractions.js";
import { ToolRegistry } from "./ToolRegistry.js";
import { ToolPipelineRunner } from "./ToolPipelineRunner.js";
import { LexicalContext } from "~/features/tools/LexicalContext/LexicalContext.js";

export const ToolsFeature = createFeature({
    name: "ToolsFeature",
    register(container: Container) {
        container.register(ToolRegistry);
        container.register(ToolPipelineRunner);
        container.register(LexicalContext).inSingletonScope();
    },
    resolve(container: Container) {
        return {
            toolRegistry: container.resolve(ToolRegistryAbstraction),
            pipelineRunner: container.resolve(PipelineRunnerAbstraction)
        };
    }
});
