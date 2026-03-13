import { useFeature } from "~/shared/di/useFeature.js";
import { EnvConfig } from "~/features/envConfig/index.js";
import { EnvConfigFeature } from "~/features/envConfig/feature.js";

/**
 * Returns the EnvConfig instance from DI.
 * Useful when you want to access EnvConfig inside components and hooks.
 */
export function useEnvConfig(): EnvConfig.Config {
    const envConfig = useFeature(EnvConfigFeature);

    return envConfig.getAll();
}
