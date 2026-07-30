import { createFeature } from "@webiny/feature/api";
import { AiImageEnrichmentAfterCreateHandler } from "./AiImageEnrichmentAfterCreateHandler.js";
import { AiImageEnrichmentTask } from "./AiImageEnrichmentTask.js";
import { AiImageEnrichmentStreamRoute } from "./AiImageEnrichmentStreamRoute.js";
import { PrepareImageEnrichmentUseCase } from "./PrepareImageEnrichmentUseCase.js";
import { ApplyImageEnrichmentUseCase } from "./ApplyImageEnrichmentUseCase.js";

export const AiImageEnrichmentFeature = createFeature({
    name: "AiPowerUps/AiImageEnrichment",
    register(container) {
        container.register(PrepareImageEnrichmentUseCase);
        container.register(ApplyImageEnrichmentUseCase);

        container.register(AiImageEnrichmentAfterCreateHandler);
        container.register(AiImageEnrichmentTask);

        // On-demand re-enrichment, streamed. The WCP gate lives inside the route (request time),
        // same as in the after-create handler.
        container.register(AiImageEnrichmentStreamRoute);
    }
});
