import { EnvConfig } from "./abstractions.js";
import { DefaultEnvConfig } from "./EnvConfig.js";
import { createFeature } from "~/shared/di/createFeature.js";

export const EnvConfigFeature = createFeature({
    name: "EnvConfig",
    register(container, params: EnvConfig.Config) {
        container.registerInstance(EnvConfig, new DefaultEnvConfig(params));
    },
    resolve(container) {
        return container.resolve(EnvConfig);
    }
});
