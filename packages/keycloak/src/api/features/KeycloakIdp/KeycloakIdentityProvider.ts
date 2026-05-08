import { OidcIdentityProvider } from "@webiny/api-core/idp";
import { KeycloakIdpConfig } from "./abstractions.js";

/**
 * Identifies + maps Keycloak-issued JWTs into Webiny identities.
 *
 * Mirrors @webiny/auth0 and @webiny/okta — same OidcIdentityProvider
 * shape, swap `.auth0.com` hostname check for an exact issuer match
 * against `KEYCLOAK_ISSUER`. Any number of OIDC providers can coexist;
 * the JwtAuthenticator picks whichever one's `isApplicable` returns
 * `true` for the incoming token.
 */
class KeycloakIdentityProviderImpl implements OidcIdentityProvider.Interface {
    public issuer = String(process.env.KEYCLOAK_ISSUER);
    public clientId = String(process.env.KEYCLOAK_CLIENT_ID);
    // Optional in-network override. When the API can't reach the issuer
    // URL directly (e.g., the browser sees `http://localhost:8180/...`
    // but the API container needs `http://keycloak:8080/...`), set this
    // to the in-network JWKS endpoint to skip discovery.
    public jwksUrl = process.env.KEYCLOAK_JWKS_URL || undefined;

    constructor(private config: KeycloakIdpConfig.Interface) {}

    isApplicable(token: OidcIdentityProvider.JwtPayload) {
        const issuer = token.iss as string;
        if (!issuer) {
            return false;
        }
        // Exact-match the configured Keycloak realm issuer URL — Keycloak
        // hosts may have arbitrary domains, so a hostname-suffix check
        // (like Auth0's `.auth0.com`) doesn't fit. The realm URL is the
        // tightest available signal.
        return issuer === this.issuer;
    }

    async getIdentity(
        jwt: OidcIdentityProvider.JwtPayload
    ): Promise<OidcIdentityProvider.IdentityData> {
        const identity = await this.config.getIdentity(jwt);

        return {
            ...identity,
            type: "admin",
            profile: {
                ...identity.profile,
                external: true
            }
        };
    }

    async verifyTokenClaims(token: OidcIdentityProvider.JwtPayload): Promise<void> {
        if (this.config.verifyTokenClaims) {
            await this.config.verifyTokenClaims(token);
        }
    }
}

export const KeycloakIdentityProvider = OidcIdentityProvider.createImplementation({
    implementation: KeycloakIdentityProviderImpl,
    dependencies: [KeycloakIdpConfig]
});
