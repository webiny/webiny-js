import { createFeature } from "@webiny/feature/api";
import { PasswordEncryption } from "./PasswordEncryption.js";

export const EncryptionFeature = createFeature({
    name: "Mailer/Encryption",
    register(container) {
        container.register(PasswordEncryption).inSingletonScope();
    }
});
