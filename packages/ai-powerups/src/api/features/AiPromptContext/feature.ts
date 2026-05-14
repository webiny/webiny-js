import { createFeature } from "@webiny/feature/api";
import { ProjectFileCache } from "./ProjectFileCache.js";
import { ProjectFileAssembler } from "./ProjectFileAssembler.js";
import { AiPromptContextBuilder } from "./AiPromptContextBuilder.js";

export const AiPromptContextFeature = createFeature({
    name: "AiPowerUps/AiPromptContext",
    register(container) {
        container.register(ProjectFileCache);
        container.register(ProjectFileAssembler);
        container.register(AiPromptContextBuilder);
    }
});
