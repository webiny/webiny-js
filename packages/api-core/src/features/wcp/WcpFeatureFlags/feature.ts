import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { WcpFeatureFlags } from "./WcpFeatureFlags.js";

export const WcpFeatureFlagsFeature = createFeature({
    name: "WcpFeatureFlags",
    register(container: Container) {
        container.register(WcpFeatureFlags).inSingletonScope();
    }
});
