import { Authorizer } from "~/features/security/authorization/Authorizer/abstractions.js";
import type { IAuthorizer } from "~/features/security/authorization/Authorizer/abstractions.js";
import type { Identity } from "~/features/security/IdentityContext/Identity.js";
import type { SecurityPermission } from "~/types/security.js";

class ApiKeyAuthorizerImpl implements IAuthorizer {
    async authorize(identity: Identity): Promise<SecurityPermission[] | null> {
        if (!identity || identity.type !== "api-key") {
            return null;
        }
        const permissions = (identity as any).permissions;
        return Array.isArray(permissions) ? (permissions as SecurityPermission[]) : [];
    }
}

export const ApiKeyAuthorizer = Authorizer.createImplementation({
    implementation: ApiKeyAuthorizerImpl,
    dependencies: []
});
