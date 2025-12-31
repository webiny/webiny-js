import { Okta } from "webiny/idp/okta";
import jwt from "jsonwebtoken";
import type { Identity } from "@webiny/app-admin/src/domain/Identity.js";
import type { Tenant } from "@webiny/api-core/src/types/tenancy.js";

interface IIdpConfig {
    getIdentity(token: jwt.JwtPayload): Promise<Identity.Data> | Identity.Data;
    getDefaultTenantId(identity: Identity.Data): string;
    canAccessTenant(identity: Identity, tenant: Tenant): boolean;
    verifyToken?(jwt: string): Promise<jwt.JwtPayload> | jwt.JwtPayload;
    verifyTokenClaims?(jwt: jwt.JwtPayload): Promise<jwt.JwtPayload> | jwt.JwtPayload;
}

class MyOktaConfig implements Okta.Api.Interface {
    getIdentity(token: jwt.JwtPayload) {
        return {
            id: token["sub"],
            type: "admin",
            displayName: token["name"],
            // User profile on this tenant
            profile: {
                roles: [token["role"]],
                teams: [token["team"]],
                firstName: token["given_name"],
                lastName: token["family_name"],
                email: token["email"]
            },
            // For all other custom runtime data. This is not stored in the database.
            context: {
                clientId: token["iss"],
                defaultTenant: token["tenantId"]
            }
        };
    }

    getDefaultTenantId(identity) {
        // Return the default tenant ID for this identity.
        return identity.context.defaultTenant;
    }

    canAccessTenant(identity, tenant) {
        // Implement logic that determines if the user can access the tenant.
        return identity.context.tenantId === tenant.id;
    }

    /**
     * Optional
     */
    async verifyToken(jwt: string): jwt.JwtPayload {
        // If not using JWKeys, implement your own verification logic.
        // The moment you implement this method, JWK verification is disabled.
    }

    /**
     * Optional
     */
    async verifyTokenClaims(jwt: jwt.JwtPayload): jwt.JwtPayload {
        // If using standard JWKeys, this callback will allow you to verify additional claims.
    }
}

export default Okta.Api.createImplementation({
    implementation: MyOktaConfig,
    dependencies: []
});
