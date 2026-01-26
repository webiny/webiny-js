import { verify } from "jsonwebtoken";
import { JwtIdentityProvider } from "webiny/api/security";
import { TenantContext } from "webiny/api/tenancy";

const JWT_SECRET = process.env.WEBINY_API_IDP_SECRET_KEY as string;

class CustomIdentityProviderImpl implements JwtIdentityProvider.Interface {
    constructor(private tenantContext: TenantContext.Interface) {}

    isApplicable(token: JwtIdentityProvider.JwtPayload) {
        /**
         * Determine whether this provider should be used for the given JWT.
         * Example: check if `token.iss` (issuer) matches the expected issuer.
         */
        return true;
    }

    async getIdentity(token: string): Promise<JwtIdentityProvider.IdentityData> {
        // Verify token using a shared secret.
        const idToken = verify(token, JWT_SECRET) as JwtIdentityProvider.JwtPayload;

        const tenant = this.tenantContext.getTenant();
        const tenantId = idToken["tenantId"];

        return {
            id: String(idToken["sub"]),
            displayName: idToken["email"],
            roles: idToken["roles"],
            profile: {
                email: idToken["email"]
            },
            context: {
                defaultTenant: tenantId,
                /**
                 * 1) Root tenant user can access all tenants.
                 * 2) Non-root tenant users can only access their own tenant.
                 */
                canAccessTenant: tenantId === "root" || tenantId === tenant.id
            }
        };
    }
}

export default JwtIdentityProvider.createImplementation({
    implementation: CustomIdentityProviderImpl,
    dependencies: [TenantContext]
});
