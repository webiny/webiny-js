import { createFeature } from "@webiny/feature/api";
import { AiPromptContextBuilder } from "./AiPromptContextBuilder.js";

export const AiPromptContextFeature = createFeature({
    name: "AiPowerUps/AiPromptContext",
    register(container) {
        container.register(AiPromptContextBuilder);
    }
});
