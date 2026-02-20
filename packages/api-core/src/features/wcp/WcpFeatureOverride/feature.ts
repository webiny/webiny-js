import { createFeature } from "@webiny/feature/api";
import type { Container } from "@webiny/di";
import { WcpFeatureOverrides } from "./WcpFeatureOverrides.js";

export const WcpFeatureOverrideFeature = createFeature({
    name: "WcpFeatureOverride",
    register(container: Container) {
        container.register(WcpFeatureOverrides).inSingletonScope();
    }
});
