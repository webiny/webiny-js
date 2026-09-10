import { createFeature } from "@webiny/feature/admin";
import { AiPromptFormFactory } from "./AiPromptFormFactory.js";

export const AiPromptFormFeature = createFeature({
    name: "AiPowerUps/PromptFormFactory",
    register(container) {
        container.register(AiPromptFormFactory);
    }
});
