import jwt from "jsonwebtoken";
import { Authenticator } from "~/features/security/authentication/Authenticator/abstractions.js";
import { IdentityProvider, JwtIdentityProvider } from "./abstractions.js";
import { isJwt } from "~/features/security/utils/isJwt.js";
import type { IdentityData } from "~/features/security/IdentityContext/Identity.js";

class JwtAuthenticatorImpl implements Authenticator.Interface {
    constructor(private providers: JwtIdentityProvider.Interface[]) {}

    async authenticate(token: string): Promise<IdentityData | null> {
        if (!isJwt(token)) {
            return null;
        }

        // Decode JWT to get payload
        const decoded = jwt.decode(token, { complete: true });
        if (!decoded || typeof decoded === "string") {
            return null;
        }

        if (typeof decoded.payload === "string") {
            return null;
        }

        // TODO: validate expiration claim and exit early if expired

        for (const provider of this.providers) {
            // Check if provider is applicable
            if (provider.isApplicable(decoded.payload as IdentityProvider.JwtPayload)) {
                // Use provider to get identity
                const identity = await provider.getIdentity(
                    token,
                    decoded as JwtIdentityProvider.Jwt
                );

                if (identity) {
                    return identity;
                }
            }
        }

        // No applicable provider found
        return null;
    }
}

export const JwtAuthenticator = Authenticator.createImplementation({
    implementation: JwtAuthenticatorImpl,
    dependencies: [[JwtIdentityProvider, { multiple: true }]]
});
