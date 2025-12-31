import jwt from "jsonwebtoken";
import { Authenticator } from "~/features/security/authentication/Authenticator/abstractions.js";
import { IdpProviderFactory } from "./abstractions.js";
import { isJwt } from "~/features/security/utils/isJwt.js";
import type { IdentityData } from "~/features/security/IdentityContext/Identity.js";

class IdpAuthenticatorImpl implements Authenticator.Interface {
    constructor(private providerFactories: IdpProviderFactory.Interface[]) {}

    async authenticate(token: string): Promise<IdentityData | null> {
        // Validate token is JWT
        if (!isJwt(token)) {
            return null;
        }

        // Decode JWT to get payload
        const decoded = jwt.decode(token);
        if (!decoded || typeof decoded === "string") {
            return null;
        }

        // Iterate through factories to find applicable provider
        for (const factory of this.providerFactories) {
            const provider = await factory.getIdpProvider();

            // Check if provider is applicable
            if (provider.isApplicable(decoded)) {
                // Use provider to get identity
                const identity = await provider.getIdentity(token);
                if (identity) {
                    return identity;
                }
            }
        }

        // No applicable provider found
        return null;
    }
}

export const IdpAuthenticator = Authenticator.createImplementation({
    implementation: IdpAuthenticatorImpl,
    dependencies: [[IdpProviderFactory, { multiple: true }]]
});
