import { Authorizer } from "@webiny/api-core/features/security/authorization/Authorizer/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";

export class MockAuthorizer implements Authorizer.Interface {
    async authorize(): Promise<SecurityPermission[] | null> {
        return [{ name: "*" }];
    }
}
