import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { FeatureFlags } from "./FeatureFlags.js";

export const FeatureFlagsFeature = createFeature({
    name: "FeatureFlags",
    register(container: Container) {
        container.register(FeatureFlags).inSingletonScope();
    }
});
