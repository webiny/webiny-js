import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { WcpFeatureOverrides } from "./WcpFeatureFlags.js";

export const WcpFeatureFlagsFeature = createFeature({
    name: "WcpFeatureFlags",
    register(container: Container) {
        container.register(WcpFeatureOverrides).inSingletonScope();
    }
});
