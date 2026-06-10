import { Authorizer } from "~/features/security/authorization/Authorizer/abstractions.js";
import type { IAuthorizer } from "~/features/security/authorization/Authorizer/abstractions.js";

class TestAuthorizerImpl implements IAuthorizer {
    async authorize(identity: any): Promise<any> {
        if (identity?.roles?.includes("full-access")) {
            return [{ name: "*" }];
        }
        return null;
    }
}

export const TestAuthorizer = Authorizer.createImplementation({
    implementation: TestAuthorizerImpl,
    dependencies: []
});
