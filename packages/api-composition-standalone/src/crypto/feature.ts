import { createFeature } from "@webiny/feature/api";
import { StandaloneEncryptionConfig } from "./StandaloneEncryptionConfig.js";
import { StandaloneHashingConfig } from "./StandaloneHashingConfig.js";

/** Replaces api-core's build-param crypto configs with ones that read secrets from env. */
export const StandaloneCryptoConfigFeature = createFeature({
    name: "StandaloneCryptoConfigFeature",
    register(container) {
        container.register(StandaloneEncryptionConfig);
        container.register(StandaloneHashingConfig);
    }
});
