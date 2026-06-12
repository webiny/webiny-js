import { Abstraction } from "@webiny/di";
import { Authorizer } from "@webiny/api-core/features/security/authorization/Authorizer/abstractions.js";
import type { IAuthorizer } from "@webiny/api-core/features/security/authorization/Authorizer/abstractions.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { TestIdentity } from "./TestAuthenticator.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";

export const TestPermissions = new Abstraction<SecurityPermission[]>("CmsTestPermissions");

class TestAuthorizerImpl implements IAuthorizer {
    constructor(
        private permissions: SecurityPermission[],
        private identity: IdentityData
    ) {}

    async authorize(): Promise<SecurityPermission[] | null> {
        if (this.permissions.length > 0) {
            return this.permissions;
        }
        // For api-key identities with embedded permissions, return those (mirrors apiKeyAuthorization)
        if (
            this.identity?.type === "api-key" &&
            Array.isArray((this.identity as any).permissions)
        ) {
            return (this.identity as any).permissions;
        }
        return this.permissions;
    }
}

export const TestAuthorizer = Authorizer.createImplementation({
    implementation: TestAuthorizerImpl,
    dependencies: [TestPermissions, TestIdentity]
});
