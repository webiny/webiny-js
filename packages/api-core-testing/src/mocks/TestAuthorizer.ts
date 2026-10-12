import { Abstraction } from "@webiny/di";
import { Authorizer } from "@webiny/api-core/features/security/authorization/Authorizer/abstractions.js";
import type { IAuthorizer } from "@webiny/api-core/features/security/authorization/Authorizer/abstractions.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type {
    Identity,
    IdentityData
} from "@webiny/api-core/features/security/IdentityContext/index.js";
import { TestIdentity } from "./TestAuthenticator.js";

/**
 * The permissions granted to the test identity, wrapped in a holder so DI treats it as a single
 * value (not a multiple-binding of SecurityPermission):
 * `container.registerInstance(TestPermissions, { list: [{ name: "*" }] })`.
 *
 * `byIdentity` grants other identities their own permissions (by identity id), for code that
 * evaluates another user through `IdentityContext.withIdentity`. Other identities not listed get
 * no permissions.
 */
export interface TestPermissionsHolder {
    list: SecurityPermission[];
    byIdentity?: Record<string, SecurityPermission[]>;
}

export const TestPermissions = new Abstraction<TestPermissionsHolder>("TestPermissions");

class TestAuthorizerImpl implements IAuthorizer {
    constructor(
        private permissions: TestPermissionsHolder,
        private requestIdentity: IdentityData | null
    ) {}

    async authorize(identity: Identity): Promise<SecurityPermission[] | null> {
        if (this.isRequestIdentity(identity)) {
            if (this.permissions.list.length > 0) {
                return this.permissions.list;
            }
            // An API-key request identity with embedded permissions (mirrors ApiKeyAuthorizer).
            if (identity.type === "api-key") {
                return identity.permissions;
            }
            return this.permissions.list;
        }
        // A real API key authenticated during the test: leave it to api-core's ApiKeyAuthorizer.
        if (identity.type === "api-key") {
            return null;
        }
        // Another identity (withIdentity): only what the test granted it (R70).
        return this.permissions.byIdentity?.[identity.id] ?? [];
    }

    private isRequestIdentity(identity: Identity): boolean {
        if (!this.requestIdentity) {
            return identity.isAnonymous();
        }
        return identity.id === this.requestIdentity.id;
    }
}

export const TestAuthorizer = Authorizer.createImplementation({
    implementation: TestAuthorizerImpl,
    dependencies: [TestPermissions, TestIdentity]
});
