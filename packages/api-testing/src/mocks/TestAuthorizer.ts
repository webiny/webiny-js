import { Abstraction } from "@webiny/di";
import { Authorizer } from "@webiny/api-core/features/security/authorization/Authorizer/abstractions.js";
import type { IAuthorizer } from "@webiny/api-core/features/security/authorization/Authorizer/abstractions.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";

/**
 * The permissions granted to the test identity. Register an instance to control access:
 * `container.registerInstance(TestPermissions, [{ name: "*" }])`.
 */
export const TestPermissions = new Abstraction<SecurityPermission[]>("TestPermissions");

class TestAuthorizerImpl implements IAuthorizer {
    constructor(private permissions: SecurityPermission[]) {}

    async authorize(): Promise<SecurityPermission[] | null> {
        return this.permissions;
    }
}

export const TestAuthorizer = Authorizer.createImplementation({
    implementation: TestAuthorizerImpl,
    // `dependencies` typing infers an array-valued abstraction as multiple-injection; TestPermissions
    // is a single registered instance (the whole permissions array), so cast past that inference.
    dependencies: [TestPermissions] as never
});
