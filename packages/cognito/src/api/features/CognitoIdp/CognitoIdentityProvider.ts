import { OidcIdentityProvider } from "@webiny/api-core/idp";
import { CognitoIdpConfig } from "./abstractions.js";

class CognitoIdentityProviderImpl implements OidcIdentityProvider.Interface {
    public clientId: string;
    public issuer: string;

    constructor(private config: CognitoIdpConfig.Interface | undefined) {
        const region = String(process.env.COGNITO_REGION);
        const userPoolId = String(process.env.COGNITO_USER_POOL_ID);
        this.clientId = String(process.env.COGNITO_CLIENT_ID);
        this.issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
    }

    isApplicable(token: OidcIdentityProvider.JwtPayload) {
        const issuer = token.iss as string;
        if (!issuer) {
            return false;
        }

        return issuer === this.issuer;
    }

    async getIdentity(
        token: OidcIdentityProvider.JwtPayload
    ): Promise<OidcIdentityProvider.IdentityData> {
        const customIdentity = this.config ? await this.config.getIdentity(token) : null;

        if (customIdentity) {
            return {
                ...customIdentity,
                type: "admin",
                profile: {
                    ...customIdentity,
                    external: false
                }
            };
        }

        // Default identity
        const customId = token["custom:id"] as string | undefined;
        const givenName = token["given_name"] as string | undefined;
        const familyName = token["family_name"] as string | undefined;
        const email = token["email"] as string | undefined;

        return {
            id: customId || token.sub || "",
            displayName: `${givenName || ""} ${familyName || ""}`.trim() || email || "Unknown User",
            type: "admin",
            profile: {
                email: email || "",
                firstName: givenName || "",
                lastName: familyName || "",
                external: false
            }
        };
    }

    async verifyTokenClaims(token: OidcIdentityProvider.JwtPayload): Promise<void> {
        if (this.config?.verifyTokenClaims) {
            await this.config.verifyTokenClaims(token);
        }
    }
}

export const CognitoIdentityProvider = OidcIdentityProvider.createImplementation({
    implementation: CognitoIdentityProviderImpl,
    dependencies: [[CognitoIdpConfig, { optional: true }]]
});
