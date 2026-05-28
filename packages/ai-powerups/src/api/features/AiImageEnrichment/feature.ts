import { createFeature } from "@webiny/feature/api";
import { AiImageEnrichmentAfterCreateHandler } from "./AiImageEnrichmentAfterCreateHandler.js";
import { AiImageEnrichmentTask } from "./AiImageEnrichmentTask.js";

export const AiImageEnrichmentFeature = createFeature({
    name: "AiPowerUps/AiImageEnrichment",
    register(container) {
        container.register(AiImageEnrichmentAfterCreateHandler);
        container.register(AiImageEnrichmentTask);
    }
});
