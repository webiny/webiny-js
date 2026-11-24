import { verifyJwtUsingJwk } from "~/features/security/utils/verifyJwtUsingJwk.js";
import type { IdentityData } from "~/features/security/IdentityContext/Identity.js";
import { JwkCache, JwtIdentityProvider, OidcIdentityProvider } from "./abstractions.js";
import { AuthenticationError } from "~/features/security/authentication/AuthenticationContext/errors.js";
import { InvalidTokenError } from "~/features/security/authentication/AuthenticationContext/errors.js";

class OidcJwtIdentityProviderImpl implements JwtIdentityProvider.Interface {
    constructor(
        private oidcIdentityProviders: OidcIdentityProvider.Interface[],
        private jwksCache: JwkCache.Interface
    ) {}

    isApplicable(token: JwtIdentityProvider.JwtPayload): boolean {
        return this.oidcIdentityProviders.some(provider => provider.isApplicable(token));
    }

    async getIdentity(token: string, jwt: JwtIdentityProvider.Jwt): Promise<IdentityData | null> {
        const { header, payload } = jwt;

        const provider = this.getApplicableProvider(payload);

        if (!provider) {
            return null;
        }

        const verifiedPayload = await this.verifyToken(provider, token, header);

        if (!verifiedPayload) {
            return null;
        }

        // Call config.getIdentity to get IdentityData
        const providerIdentity = await provider.getIdentity(verifiedPayload);

        const identity: IdentityData = {
            ...providerIdentity,
            type: providerIdentity.type ?? "admin"
        };

        // Handle default values
        const context = identity.context ?? { canAccessTenant: true, defaultTenantId: "root" };
        if (context.canAccessTenant === undefined) {
            context.canAccessTenant = true;
        }
        if (context.defaultTenantId === undefined) {
            context.defaultTenantId = "root";
        }

        identity.context = context;

        return identity;
    }

    private getApplicableProvider(
        payload: JwtIdentityProvider.JwtPayload
    ): OidcIdentityProvider.Interface | undefined {
        return this.oidcIdentityProviders.find(provider => provider.isApplicable(payload));
    }

    private async verifyToken(
        provider: OidcIdentityProvider.Interface,
        token: string,
        header: JwtIdentityProvider.JwtHeader
    ) {
        // If the implementation specifies a custom verification function, use it.
        let verifiedPayload: JwtIdentityProvider.JwtPayload | undefined;
        if (typeof provider.verifyToken === "function") {
            // Use custom verification
            const result = await provider.verifyToken(token);
            if (result) {
                return result;
            }
            return null;
        }

        // Otherwise, continue with OIDC best practices, using JWKs.

        // Fetch JWKs from cache
        const jwks = await this.jwksCache.getKeys(provider.issuer);

        /*
         * Find matching JWK using header.kid. A key we don't have may be a key the issuer rotated in
         * since the keys were cached, so fetch them once more before rejecting the token.
         */
        let jwk = jwks.find(key => key.kid === header.kid);
        if (!jwk) {
            const refreshed = await this.jwksCache.refreshKeys(provider.issuer);
            jwk = refreshed?.find(key => key.kid === header.kid);
        }
        if (!jwk) {
            return null;
        }

        if (!verifiedPayload) {
            // Default JWK verification
            verifiedPayload = await verifyJwtUsingJwk(token, jwk);
        }

        /*
         * Throwing from verifyTokenClaims is the documented way to reject a token, so whatever it
         * throws is a rejection. Converting it here keeps it apart from errors that are not about the
         * token, which AuthenticationContext lets through as they are.
         */
        if (provider.verifyTokenClaims) {
            try {
                await provider.verifyTokenClaims(verifiedPayload);
            } catch (error) {
                if (error instanceof AuthenticationError) {
                    throw error;
                }
                // An empty message falls back to InvalidTokenError's own.
                const message = error instanceof Error && error.message ? error.message : undefined;
                throw new InvalidTokenError(message);
            }
        }

        return verifiedPayload;
    }
}

export const OidcJwtIdentityProvider = JwtIdentityProvider.createImplementation({
    implementation: OidcJwtIdentityProviderImpl,
    dependencies: [[OidcIdentityProvider, { multiple: true }], JwkCache]
});
