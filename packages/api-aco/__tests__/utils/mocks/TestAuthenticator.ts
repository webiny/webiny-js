import { Abstraction } from "@webiny/di";
import { Authenticator } from "@webiny/api-core/features/security/authentication/Authenticator/abstractions.js";
import type { IAuthenticator } from "@webiny/api-core/features/security/authentication/Authenticator/abstractions.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";

export const TestIdentity = new Abstraction<IdentityData | null>("AcoTestIdentity");

class TestAuthenticatorImpl implements IAuthenticator {
    constructor(private identity: IdentityData | null) {}

    async authenticate(_token: string): Promise<any> {
        return this.identity;
    }
}

export const TestAuthenticator = Authenticator.createImplementation({
    implementation: TestAuthenticatorImpl,
    dependencies: [TestIdentity]
});
