import { createFeature } from "@webiny/feature/api";
import { OpenAiSdkFactory } from "./OpenAiSdkFactory.js";
import { AnthropicSdkFactory } from "./AnthropicSdkFactory.js";
import { Ai } from "./Ai.js";
import { AiModelRegistry } from "./AiModelRegistry.js";
import { AiSdkTools } from "./AiSdkTools.js";
import { AiOutputToolRegistry } from "./toolPipeline/AiOutputToolRegistry.js";
import { AiToolPipelineRunner } from "./toolPipeline/AiToolPipelineRunner.js";
import { DefaultTextExtractor } from "./TextExtractor/DefaultTextExtractor.js";

export const AiFeature = createFeature({
    name: "AiFeature",
    register(container) {
        container.register(OpenAiSdkFactory);
        container.register(AnthropicSdkFactory);
        container.register(Ai);
        container.register(AiModelRegistry);
        container.register(AiSdkTools);
        container.register(AiOutputToolRegistry);
        container.register(AiToolPipelineRunner);
        container.register(DefaultTextExtractor);
    }
});
