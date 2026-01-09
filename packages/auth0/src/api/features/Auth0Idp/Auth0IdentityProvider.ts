import { OidcIdentityProvider } from "@webiny/api-core/idp";
import { Auth0IdpConfig } from "./abstractions.js";

class Auth0IdentityProviderImpl implements OidcIdentityProvider.Interface {
    public issuer = String(process.env.AUTH0_ISSUER);
    public clientId = String(process.env.AUTH0_CLIENT_ID);

    constructor(private config: Auth0IdpConfig.Interface) {}

    isApplicable(token: OidcIdentityProvider.JwtPayload) {
        const issuer = token.iss as string;
        if (!issuer) {
            return false;
        }

        return new URL(issuer).hostname.endsWith(".auth0.com") ?? false;
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

export const Auth0IdentityProvider = OidcIdentityProvider.createImplementation({
    implementation: Auth0IdentityProviderImpl,
    dependencies: [Auth0IdpConfig]
});
