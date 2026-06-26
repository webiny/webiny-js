import { createFeature } from "@webiny/feature/admin";
import { AiImageEnrichmentEventHandler } from "./AiImageEnrichmentEventHandler.js";

export const AiEnrichmentFeature = createFeature({
    name: "FileManager/AiEnrichment",
    register(container) {
        container.register(AiImageEnrichmentEventHandler);
    }
});
