import { JwtIdentityProvider } from "@webiny/api-core/idp";
import { TokenIssuer, SELF_HOSTED_ISSUER } from "~/api/domain/crypto/TokenIssuer.js";

/**
 * Validation half of the self-hosted IdP. Registered as one of the many
 * `JwtIdentityProvider`s the `JwtAuthenticator` fans out to, so it coexists with
 * Cognito/Auth0/etc. with zero special-casing.
 *
 * We are the issuer, so there is no remote JWKS to fetch — we verify the
 * signature in-process with the same secret we signed with. That is why we
 * implement `JwtIdentityProvider` directly instead of `OidcIdentityProvider`.
 */
class SelfHostedJwtIdentityProviderImpl implements JwtIdentityProvider.Interface {
    constructor(private tokenIssuer: TokenIssuer.Interface) {}

    isApplicable(payload: JwtIdentityProvider.JwtPayload): boolean {
        return payload.iss === SELF_HOSTED_ISSUER;
    }

    async getIdentity(
        token: string,
        _jwt: JwtIdentityProvider.Jwt
    ): Promise<JwtIdentityProvider.IdentityData | null> {
        const payload = await this.tokenIssuer.verify(token);
        if (!payload || !payload.sub) {
            return null;
        }

        const email = (payload.email as string | undefined) ?? "";
        const tenant = (payload.tenant as string | undefined) ?? "root";
        const displayName = (payload.displayName as string | undefined) ?? email;

        return {
            id: payload.sub,
            displayName: displayName || "Unknown User",
            type: "admin",
            profile: {
                email,
                external: false
            },
            context: {
                defaultTenantId: tenant,
                canAccessTenant: true
            }
        };
    }
}

export const SelfHostedJwtIdentityProvider = JwtIdentityProvider.createImplementation({
    implementation: SelfHostedJwtIdentityProviderImpl,
    dependencies: [TokenIssuer]
});
