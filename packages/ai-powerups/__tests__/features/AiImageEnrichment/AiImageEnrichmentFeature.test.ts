import { describe, it, expect, beforeEach } from "vitest";
import { Container } from "@webiny/di";
import { HttpRoute, RequestContainer } from "@webiny/event-handler-core";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { FeatureFlags as FeatureFlagsClass } from "@webiny/feature-flags";
import { AiImageEnrichmentFeature } from "~/api/features/AiImageEnrichment/feature.js";

const FLAG = "aiPowerups.fileManager.imageEnrichment";

function containerWithFlag(enabled: boolean): Container {
    const container = new Container();
    container.registerInstance(RequestContainer, container);
    container.registerInstance(FeatureFlags, {
        get: () =>
            FeatureFlagsClass.fromDto({ aiPowerups: { fileManager: { imageEnrichment: enabled } } })
    } as any);
    return container;
}

describe("AiImageEnrichmentFeature registration gate", () => {
    let enabledFlags: FeatureFlagsClass;

    beforeEach(() => {
        enabledFlags = FeatureFlagsClass.fromDto({
            aiPowerups: { fileManager: { imageEnrichment: true } }
        });
    });

    it("should register the streaming route when the flag is enabled", () => {
        expect(enabledFlags.isEnabled(FLAG)).toBe(true);

        const container = containerWithFlag(true);
        AiImageEnrichmentFeature.register(container);

        expect(container.resolveAll(HttpRoute)).toHaveLength(1);
    });

    it("should register nothing when the flag is disabled", () => {
        // The gate replaced a request-time 403: with the flag off the route does not exist at all, so
        // an unlicensed caller gets a router 404 instead of reaching route code.
        const container = containerWithFlag(false);
        AiImageEnrichmentFeature.register(container);

        expect(container.resolveAll(HttpRoute)).toHaveLength(0);
    });
});
