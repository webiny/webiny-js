import { createFeature } from "@webiny/feature/admin";
import { AiPrompt } from "./AiPrompt.js";
import { AiPrompt as Abstraction } from "./abstractions.js";
import { AiPromptRepository } from "./AiPromptRepository.js";
import { AiPromptGateway } from "./AiPromptGateway.js";

export const AiPromptFeature = createFeature({
    name: "AiPrompt",
    register(container) {
        container.register(AiPrompt).inSingletonScope();
        container.register(AiPromptRepository).inSingletonScope();
        container.register(AiPromptGateway).inSingletonScope();
    },
    resolve(container) {
        return {
            aiPrompt: container.resolve(Abstraction)
        };
    }
});
