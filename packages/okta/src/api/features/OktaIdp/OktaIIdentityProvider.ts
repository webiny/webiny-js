import { OidcIdentityProvider } from "@webiny/api-core/idp";
import { OktaIdpConfig } from "./abstractions.js";

class OktaIdentityProviderImpl implements OidcIdentityProvider.Interface {
    public issuer = String(process.env.OKTA_ISSUER);
    public clientId = String(process.env.OKTA_CLIENT_ID);

    constructor(private config: OktaIdpConfig.Interface) {}

    isApplicable(token: OidcIdentityProvider.JwtPayload) {
        const issuer = token.iss as string;
        if (!issuer) {
            return false;
        }

        return new URL(issuer).hostname.endsWith(".okta.com") ?? false;
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

export const OktaIIdentityProvider = OidcIdentityProvider.createImplementation({
    implementation: OktaIdentityProviderImpl,
    dependencies: [OktaIdpConfig]
});
