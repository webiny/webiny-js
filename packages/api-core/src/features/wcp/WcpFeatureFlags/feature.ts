import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { WcpFeatureOverrides } from "./WcpFeatureOverrides.js";

export const WcpFeatureFlagsFeature = createFeature({
    name: "WcpFeatureFlags",
    register(container: Container) {
        container.register(WcpFeatureOverrides).inSingletonScope();
    }
});
