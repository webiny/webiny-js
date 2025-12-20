import { Encryption } from "~/domain/Encryption/abstractions.js";
import { encrypt, decrypt } from "./utils/password.js";
import { getSecret } from "./utils/secret.js";

class PasswordEncryptionImpl implements Encryption.Interface {
    private readonly secret: string | null = null;

    constructor() {
        this.secret = getSecret();
    }

    async encrypt(value: string): Promise<string> {
        return encrypt({ value, secret: this.secret });
    }

    async decrypt(value: string): Promise<string> {
        return decrypt({ value, secret: this.secret });
    }
}

export const PasswordEncryption = Encryption.createImplementation({
    implementation: PasswordEncryptionImpl,
    dependencies: []
});
