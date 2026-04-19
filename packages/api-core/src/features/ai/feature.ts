import { createFeature } from "@webiny/feature/api";
import { OpenAiSdkFactory } from "./OpenAiSdkFactory.js";
import { AnthropicSdkFactory } from "./AnthropicSdkFactory.js";
import { Ai } from "./Ai.js";

export const AiFeature = createFeature({
    name: "AiFeature",
    register(container) {
        container.register(OpenAiSdkFactory);
        container.register(AnthropicSdkFactory);
        container.register(Ai);
    }
});
