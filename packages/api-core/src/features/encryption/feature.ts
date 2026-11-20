import { createFeature } from "@webiny/feature/api";
import { Encryption } from "./EncryptionService.js";
import { BuildParamsEncryptionConfig } from "./BuildParamsEncryptionConfig.js";

export const EncryptionFeature = createFeature({
    name: "EncryptionFeature",
    register(container) {
        container.register(BuildParamsEncryptionConfig);
        container.register(Encryption);
    }
});
