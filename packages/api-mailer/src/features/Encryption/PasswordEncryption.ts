import { Encryption } from "~/domain/Encryption/abstractions.js";
import { decrypt, encrypt } from "./utils/password.js";
import { getSecret } from "./utils/secret.js";

class PasswordEncryptionImpl implements Encryption.Interface {
    public async encrypt(value: string): Promise<string> {
        return encrypt({ value, secret: getSecret() });
    }

    public async decrypt(value: string): Promise<string> {
        return decrypt({ value, secret: getSecret() });
    }
}

export const PasswordEncryption = Encryption.createImplementation({
    implementation: PasswordEncryptionImpl,
    dependencies: []
});
