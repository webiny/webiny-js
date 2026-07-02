import { Authenticator } from "~/features/security/authentication/Authenticator/abstractions.js";
import type { IAuthenticator } from "~/features/security/authentication/Authenticator/abstractions.js";

class TestAuthenticatorImpl implements IAuthenticator {
    async authenticate(token: string): Promise<any> {
        if (token) {
            return null; // let real authenticators handle tokens
        }
        return {
            id: "123456789",
            displayName: "John Doe",
            type: "admin",
            roles: ["full-access"],
            profile: { external: true }
        };
    }
}

export const TestAuthenticator = Authenticator.createImplementation({
    implementation: TestAuthenticatorImpl,
    dependencies: []
});
