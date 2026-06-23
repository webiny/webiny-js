import { Abstraction } from "@webiny/di";
import type { IAuthorizer } from "@webiny/api-core/features/security/authorization/Authorizer/abstractions.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { Authorizer } from "@webiny/api-core/features/security/authorization/Authorizer/abstractions.js";

export const TestPermissions = new Abstraction<SecurityPermission[]>("FileManagerTestPermissions");

class TestAuthorizerImpl implements IAuthorizer {
    constructor(private permissions: SecurityPermission[]) {}

    async authorize(): Promise<SecurityPermission[] | null> {
        return this.permissions;
    }
}

export const TestAuthorizer = Authorizer.createImplementation({
    implementation: TestAuthorizerImpl,
    dependencies: [TestPermissions]
});
