import { createFeature } from "@webiny/feature/api";
import { OpenAiSdkFactory } from "./OpenAiSdkFactory.js";
import { AnthropicSdkFactory } from "./AnthropicSdkFactory.js";
import { createAiConnection } from "./AiConnection.js";
import { Ai } from "./Ai.js";

export const AiFeature = createFeature({
    name: "AiFeature",
    register(container) {
        container.register(OpenAiSdkFactory);
        container.register(AnthropicSdkFactory);
        container.register(createAiConnection({ id: "openai", sdkName: "openai" }));
        container.register(createAiConnection({ id: "anthropic", sdkName: "anthropic" }));
        container.register(Ai);
    }
});
