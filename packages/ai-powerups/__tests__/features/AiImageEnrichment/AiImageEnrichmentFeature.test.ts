import { describe, it, expect, vi } from "vitest";
import { Container } from "@webiny/di";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { FeatureFlags as FeatureFlagsClass } from "@webiny/feature-flags";
import { AiImageEnrichmentFeature } from "~/api/features/AiImageEnrichment/feature.js";
import { AiImageEnrichmentStreamRoute } from "~/api/features/AiImageEnrichment/AiImageEnrichmentStreamRoute.js";
import { AiImageEnrichmentTask } from "~/api/features/AiImageEnrichment/AiImageEnrichmentTask.js";

/**
 * Asserts what the gate DECIDES, by spying on `register`, rather than resolving the registrations.
 * Resolving would construct the route and pull its whole dependency graph (GetFileUseCase and
 * everything under it), which belongs to the real request stack, not to a test about a flag.
 */
function registerWithFlag(enabled: boolean) {
    const container = new Container();
    container.registerInstance(FeatureFlags, {
        get: () =>
            FeatureFlagsClass.fromDto({
                aiPowerups: { fileManager: { imageEnrichment: enabled } }
            })
    } as any);

    const register = vi.spyOn(container, "register");
    AiImageEnrichmentFeature.register(container);

    return register.mock.calls.map(call => call[0]);
}

describe("AiImageEnrichmentFeature registration gate", () => {
    it("should register the route and the task when the flag is enabled", () => {
        const registered = registerWithFlag(true);

        expect(registered).toContain(AiImageEnrichmentStreamRoute);
        expect(registered).toContain(AiImageEnrichmentTask);
    });

    it("should register nothing when the flag is disabled", () => {
        // The gate replaced a request-time 403: with the flag off the route does not exist at all, so
        // an unlicensed caller gets a router 404 instead of reaching route code.
        expect(registerWithFlag(false)).toHaveLength(0);
    });
});
