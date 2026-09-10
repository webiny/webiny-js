import { createFeature } from "@webiny/feature/admin";
import { Container } from "@webiny/di";
import { FeatureFlagsService as ServiceAbstraction } from "./abstractions.js";
import { FeatureFlagsService } from "./FeatureFlagsService.js";
import { FeatureFlagsGateway } from "./FeatureFlagsGateway.js";

export const FeatureFlagsFeature = createFeature({
    name: "FeatureFlags",
    register(container: Container) {
        container.register(FeatureFlagsGateway).inSingletonScope();
        container.register(FeatureFlagsService).inSingletonScope();
    },
    resolve(container: Container) {
        return {
            service: container.resolve(ServiceAbstraction)
        };
    }
});
