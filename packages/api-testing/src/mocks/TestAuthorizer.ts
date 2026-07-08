import { Abstraction } from "@webiny/di";
import { Authorizer } from "@webiny/api-core/features/security/authorization/Authorizer/abstractions.js";
import type { IAuthorizer } from "@webiny/api-core/features/security/authorization/Authorizer/abstractions.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";

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
    constructor(private permissions: TestPermissionsHolder) {}

    async authorize(): Promise<SecurityPermission[] | null> {
        return this.permissions.list;
    }
}

export const TestAuthorizer = Authorizer.createImplementation({
    implementation: TestAuthorizerImpl,
    dependencies: [TestPermissions]
});
