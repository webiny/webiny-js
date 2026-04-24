import { createFeature } from "@webiny/feature/api";
import { Encryption } from "./EncryptionService.js";

export const EncryptionFeature = createFeature({
    name: "EncryptionFeature",
    register(container) {
        container.register(Encryption);
    }
});
