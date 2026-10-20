import { createFeature } from "@webiny/feature/api";
import { OpenAiSdkFactory } from "./OpenAiSdkFactory.js";
import { AnthropicSdkFactory } from "./AnthropicSdkFactory.js";
import { GoogleSdkFactory } from "./GoogleSdkFactory.js";
import { OpenRouterSdkFactory } from "./OpenRouterSdkFactory.js";
import { Ai } from "./Ai.js";
import { AiModelRegistry } from "./AiModelRegistry.js";
import { RemoteAiModelCatalog } from "./RemoteAiModelCatalog.js";
import { AiSdkTools } from "./AiSdkTools.js";
import { AiOutputToolRegistry } from "./toolPipeline/AiOutputToolRegistry.js";
import { AiToolPipelineRunner } from "./toolPipeline/AiToolPipelineRunner.js";
import { DefaultTextExtractor } from "./TextExtractor/DefaultTextExtractor.js";

export const AiFeature = createFeature({
    name: "AiFeature",
    register(container) {
        container.register(OpenAiSdkFactory);
        container.register(AnthropicSdkFactory);
        container.register(GoogleSdkFactory);
        container.register(OpenRouterSdkFactory);
        container.register(Ai);
        container.register(RemoteAiModelCatalog);
        container.register(AiModelRegistry);
        container.register(AiSdkTools);
        container.register(AiOutputToolRegistry);
        container.register(AiToolPipelineRunner);
        container.register(DefaultTextExtractor);
    }
});
