import { createFeature } from "@webiny/feature/api";
import { AiImageEnrichmentAfterCreateHandler } from "./AiImageEnrichmentAfterCreateHandler.js";
import { AiImageEnrichmentTask } from "~/tasks/AiImageEnrichmentTask.js";

export const AiImageEnrichmentFeature = createFeature({
    name: "FileManagerAi/AiImageEnrichment",
    register(container) {
        container.register(AiImageEnrichmentAfterCreateHandler);
        container.register(AiImageEnrichmentTask);
    }
});
