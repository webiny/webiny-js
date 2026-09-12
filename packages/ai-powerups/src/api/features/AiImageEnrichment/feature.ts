import { createFeature } from "@webiny/feature/api";
import { AiImageEnrichmentAfterCreateHandler } from "./AiImageEnrichmentAfterCreateHandler.js";
import { AiImageEnrichmentTask } from "./AiImageEnrichmentTask.js";
import { FmImageEnrichmentCapability } from "./capability.js";

export const AiImageEnrichmentFeature = createFeature({
    name: "AiPowerUps/AiImageEnrichment",
    register(container) {
        container.register(FmImageEnrichmentCapability);
        container.register(AiImageEnrichmentAfterCreateHandler);
        container.register(AiImageEnrichmentTask);
    }
});
