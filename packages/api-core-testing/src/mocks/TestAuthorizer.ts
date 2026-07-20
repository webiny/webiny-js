import { Abstraction } from "@webiny/di";
import { Authorizer } from "@webiny/api-core/features/security/authorization/Authorizer/abstractions.js";
import type { IAuthorizer } from "@webiny/api-core/features/security/authorization/Authorizer/abstractions.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { TestIdentity } from "./TestAuthenticator.js";

/**
 * The permissions granted to the test identity, wrapped in a holder so DI treats it as a single
 * value (not a multiple-binding of SecurityPermission):
 * `container.registerInstance(TestPermissions, { list: [{ name: "*" }] })`.
 */
export interface TestPermissionsHolder {
    list: SecurityPermission[];
}

export const TestPermissions = new Abstraction<TestPermissionsHolder>("TestPermissions");

class TestAuthorizerImpl implements IAuthorizer {
    constructor(
        private permissions: TestPermissionsHolder,
        private identity: IdentityData | null
    ) {}

    async authorize(): Promise<SecurityPermission[] | null> {
        if (this.permissions.list.length > 0) {
            return this.permissions.list;
        }
        // For api-key identities with embedded permissions, return those (mirrors apiKeyAuthorization).
        if (
            this.identity?.type === "api-key" &&
            Array.isArray((this.identity as { permissions?: unknown }).permissions)
        ) {
            return (this.identity as unknown as { permissions: SecurityPermission[] }).permissions;
        }
        return this.permissions.list;
    }
}

export const TestAuthorizer = Authorizer.createImplementation({
    implementation: TestAuthorizerImpl,
    dependencies: [TestPermissions, TestIdentity]
});
