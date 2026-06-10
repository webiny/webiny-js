import type { Container } from "@webiny/di";
import { Authenticator } from "~/features/security/authentication/Authenticator/abstractions.js";
import { ApiKeysRepository } from "~/features/security/apiKeys/shared/abstractions.js";
import type { IAuthenticator } from "~/features/security/authentication/Authenticator/abstractions.js";
import type { IApiKeysRepository } from "~/features/security/apiKeys/shared/abstractions.js";

export interface Config {
    identityType?: string;
}

class ApiKeyAuthenticatorImpl implements IAuthenticator {
    constructor(
        private repository: IApiKeysRepository,
        private identityType: string
    ) {}

    async authenticate(token: string): Promise<any> {
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
            type: this.identityType,
            permissions: apiKey.permissions
        };
    }
}

export default ({ identityType = "api-key" }: Config = {}) =>
    (container: Container) => {
        container.registerFactory(Authenticator, () => {
            const repository = container.resolve(ApiKeysRepository);
            return new ApiKeyAuthenticatorImpl(repository, identityType);
        });
    };
