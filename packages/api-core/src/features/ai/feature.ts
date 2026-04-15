import { createFeature } from "@webiny/feature/api";
import { OpenAiProviderFactory } from "./OpenAiProviderFactory.js";
import { AnthropicProviderFactory } from "./AnthropicProviderFactory.js";
import { AiGateway } from "./AiGateway.js";
import { Ai } from "./Ai.js";

export const AiFeature = createFeature({
    name: "AiFeature",
    register(container) {
        container.register(OpenAiProviderFactory);
        container.register(AnthropicProviderFactory);
        container.register(AiGateway).inSingletonScope();
        container.register(Ai);
    }
});
