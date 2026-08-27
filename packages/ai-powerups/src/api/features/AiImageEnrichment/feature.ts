import { createFeature } from "@webiny/feature/api";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { AiImageEnrichmentAfterCreateHandler } from "./AiImageEnrichmentAfterCreateHandler.js";
import { AiImageEnrichmentTask } from "./AiImageEnrichmentTask.js";
import { AiImageEnrichmentStreamRoute } from "./AiImageEnrichmentStreamRoute.js";
import { PrepareImageEnrichmentUseCase } from "./PrepareImageEnrichmentUseCase.js";
import { ApplyImageEnrichmentUseCase } from "./ApplyImageEnrichmentUseCase.js";

export const AiImageEnrichmentFeature = createFeature({
    name: "AiPowerUps/AiImageEnrichment",
    register(container) {
        // Register-time gate on the effective feature flags (userFlag && live WCP license). Valid at
        // register() time because the license is refreshed PRE-register (WcpLicenseLoader.load() in
        // registerApiRequestStack) and FeatureFlags reads that process cache — and it re-evaluates per
        // request since the child re-registers, so a license change takes effect on the next request.
        const enabled = container
            .resolve(FeatureFlags)
            .get()
            .isEnabled("aiPowerups.fileManager.imageEnrichment");

        if (!enabled) {
            return;
        }

        container.register(PrepareImageEnrichmentUseCase);
        container.register(ApplyImageEnrichmentUseCase);

        // Automatic enrichment after a file is created.
        container.register(AiImageEnrichmentAfterCreateHandler);
        container.register(AiImageEnrichmentTask);

        // On-demand re-enrichment, streamed.
        container.register(AiImageEnrichmentStreamRoute);
    }
});
