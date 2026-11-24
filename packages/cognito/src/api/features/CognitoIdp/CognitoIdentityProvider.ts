import { OidcIdentityProvider } from "@webiny/api-core/idp";
import { CognitoIdpConfig } from "./abstractions.js";

interface FederatedIdentity {
    userId?: unknown;
}

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
        const isFederated = Array.isArray(token.identities) && token.identities.length > 0;

        const customId = token["custom:id"] as string | undefined;
        const givenName = token["given_name"] as string | undefined;
        const familyName = token["family_name"] as string | undefined;
        const email = token["email"] as string | undefined;

        const defaultIdentity: OidcIdentityProvider.IdentityData = {
            id: customId || token.sub || "",
            displayName: `${givenName || ""} ${familyName || ""}`.trim() || email || "Unknown User",
            type: "admin",
            profile: {
                email: email || "",
                firstName: givenName || "",
                lastName: familyName || "",
                external: isFederated
            }
        };

        const customIdentity = this.config ? await this.config.getIdentity(token) : null;

        if (!customIdentity) {
            return defaultIdentity;
        }

        return {
            ...defaultIdentity,
            ...customIdentity,
            type: "admin",
            profile: {
                ...defaultIdentity.profile,
                ...customIdentity.profile,
                external: isFederated
            }
        };
    }

    async verifyTokenClaims(token: OidcIdentityProvider.JwtPayload): Promise<void> {
        // Security: only Cognito ID tokens identify a user; reject access tokens.
        if (token.token_use !== "id") {
            throw new Error(`Invalid token: "token_use" must be "id".`);
        }

        // Security: federated sign-in requires "custom:id" to stay writable by the app client, so
        // a user could set their own "custom:id" to someone else's ID. The "identities" claim is
        // set by Cognito and can't be edited, so "custom:id" must match one of its provider user IDs.
        // Projects that map "custom:id" to another provider attribute can set
        // `verifyFederatedCustomId: false` on their `CognitoIdpConfig` and verify it themselves.
        if (this.config?.verifyFederatedCustomId !== false) {
            this.verifyFederatedCustomId(token);
        }

        if (this.config?.verifyTokenClaims) {
            await this.config.verifyTokenClaims(token);
        }
    }

    private verifyFederatedCustomId(token: OidcIdentityProvider.JwtPayload): void {
        const identities = this.getFederatedIdentities(token);
        if (!identities) {
            return;
        }

        const customId = token["custom:id"];
        const isMatch =
            typeof customId === "string" &&
            customId.length > 0 &&
            identities.some(identity => String(identity?.userId) === customId);

        if (!isMatch) {
            throw new Error(
                `Invalid token: "custom:id" must match the user ID of the federated identity.`
            );
        }
    }

    private getFederatedIdentities(
        token: OidcIdentityProvider.JwtPayload
    ): FederatedIdentity[] | null {
        let identities: unknown = token.identities;
        if (identities === undefined || identities === null) {
            return null;
        }

        if (typeof identities === "string") {
            try {
                identities = JSON.parse(identities);
            } catch {
                throw new Error(`Invalid token: "identities" claim is malformed.`);
            }
        }

        if (!Array.isArray(identities)) {
            throw new Error(`Invalid token: "identities" claim is malformed.`);
        }

        return identities.length > 0 ? identities : null;
    }
}

export const CognitoIdentityProvider = OidcIdentityProvider.createImplementation({
    implementation: CognitoIdentityProviderImpl,
    dependencies: [[CognitoIdpConfig, { optional: true }]]
});
