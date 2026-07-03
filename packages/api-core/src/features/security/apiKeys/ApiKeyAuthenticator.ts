import { Authenticator } from "~/features/security/authentication/Authenticator/abstractions.js";
import { ApiKeysRepository } from "./shared/abstractions.js";
import type { IAuthenticator } from "~/features/security/authentication/Authenticator/abstractions.js";
import type { IApiKeysRepository } from "./shared/abstractions.js";
import type { IdentityData } from "~/features/security/IdentityContext/Identity.js";

class ApiKeyAuthenticatorImpl implements IAuthenticator {
    constructor(private repository: IApiKeysRepository) {}

    async authenticate(token: string): Promise<IdentityData | null> {
        if (typeof token !== "string" || !token.startsWith("wat_")) {
            return null;
        }
        const result = await this.repository.getByToken(token);
        if (!result.isOk()) {
            return null;
        }
        const apiKey = result.value;
        return {
            id: apiKey.id,
            displayName: apiKey.name,
            type: "api-key",
            permissions: apiKey.permissions
        };
    }
}

export const ApiKeyAuthenticator = Authenticator.createImplementation({
    implementation: ApiKeyAuthenticatorImpl,
    dependencies: [ApiKeysRepository]
});
