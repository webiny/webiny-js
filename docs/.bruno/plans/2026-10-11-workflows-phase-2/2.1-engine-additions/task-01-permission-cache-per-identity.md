### Task 1: Cache permissions per identity and add per-identity test permissions

R49, A21. `AuthorizationContext` keeps one permission slot per request, so inside `IdentityContext.withIdentity(other, ...)` every permission check still answers for the outer identity (and if the first load happens inside the callback, the outer identity gets the other user's permissions for the rest of the request). Phase 2's `canUserRead` (R48) and phase 5's task triggers (D87) need `withIdentity` to be correct.

**Files:**
- Modify: `packages/api-core/src/features/security/authorization/AuthorizationContext/AuthorizationContext.ts`
- Create: `packages/api-core/__tests__/security/withIdentityPermissions.test.ts`
- Modify: `packages/api-core-testing/src/mocks/TestAuthorizer.ts`
- Modify: `packages/api-headless-cms-testing/src/createCmsTestHandler.ts`

**Interfaces:**
- Consumes: `IAuthorizationContext` (unchanged), `Authorizer`, `IdentityContext`, `AuthenticatedIdentity`, `Identity`.
- Produces:
  - `AuthorizationContext.loadPermissions(identity)` caches per `${identity.type}:${identity.id}`; concurrent loads for one identity share one promise; `clearPermissionsCache()` empties the cache.
  - `TestPermissionsHolder { list: SecurityPermission[]; byIdentity?: Record<string, SecurityPermission[]> }`; `TestAuthorizer.authorize(identity)` returns `byIdentity[identity.id]` when present, else the previous behaviour.
  - `CmsTestHandlerParams.permissionsByIdentity?: Record<string, SecurityPermission[]>`, passed as `TestPermissions.byIdentity`.

- [ ] **Step 1: Write the failing test**

Create `packages/api-core/__tests__/security/withIdentityPermissions.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import { License } from "@webiny/wcp";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { BuildParamsFeature } from "~/features/buildParams/feature.js";
import { FeatureFlagsFeature } from "~/features/featureFlags/feature.js";
import { WcpContextFeature } from "~/features/wcp/WcpContext/index.js";
import { WcpLicenseProviderImpl } from "~/features/wcp/WcpLicenseProvider.js";
import { AuthorizationContextFeature } from "~/features/security/authorization/AuthorizationContext/feature.js";
import { IdentityContextFeature } from "~/features/security/IdentityContext/feature.js";
import {
    AuthenticatedIdentity,
    type Identity,
    IdentityContext
} from "~/features/security/IdentityContext/index.js";
import { Authorizer } from "~/features/security/authorization/Authorizer/index.js";
import type { SecurityPermission } from "~/types/security.js";

/** Custom permission names: AACL filtering only touches built-in app prefixes (cms, fm, ...). */
const PERMISSIONS_BY_USER: Record<string, SecurityPermission[]> = {
    "user-a": [{ name: "workflows", editor: true }],
    "user-b": [{ name: "workflows", reassign: true }]
};

const authorizeCalls: string[] = [];

class PerUserAuthorizerImpl implements Authorizer.Interface {
    async authorize(identity: Identity): Promise<SecurityPermission[] | null> {
        authorizeCalls.push(identity.id);
        return PERMISSIONS_BY_USER[identity.id] ?? [];
    }
}

const PerUserAuthorizer = Authorizer.createImplementation({
    implementation: PerUserAuthorizerImpl,
    dependencies: []
});

const createIdentity = (id: string): AuthenticatedIdentity => {
    return new AuthenticatedIdentity({ id, displayName: id, type: "admin" });
};

const createIdentityContext = (): IdentityContext.Interface => {
    const container = new Container();
    const license = License.fromLicenseDto(createTestWcpLicense());

    BuildParamsFeature.register(container);
    FeatureFlagsFeature.register(container);
    WcpContextFeature.register(container, new WcpLicenseProviderImpl(license));
    AuthorizationContextFeature.register(container);
    IdentityContextFeature.register(container);
    container.register(PerUserAuthorizer);

    const identityContext = container.resolve(IdentityContext);
    identityContext.setIdentity(createIdentity("user-a"));
    return identityContext;
};

describe("permissions under withIdentity", () => {
    beforeEach(() => {
        authorizeCalls.length = 0;
    });

    it("loads the permissions of the identity set by withIdentity", async () => {
        const identityContext = createIdentityContext();

        const outerBefore = await identityContext.getPermission("workflows");
        const inner = await identityContext.withIdentity(createIdentity("user-b"), () => {
            return identityContext.getPermission("workflows");
        });
        const outerAfter = await identityContext.getPermission("workflows");

        expect(outerBefore).toEqual({ name: "workflows", editor: true });
        expect(inner).toEqual({ name: "workflows", reassign: true });
        expect(outerAfter).toEqual({ name: "workflows", editor: true });
    });

    it("does not leak permissions loaded inside withIdentity to the outer identity", async () => {
        const identityContext = createIdentityContext();

        await identityContext.withIdentity(createIdentity("user-b"), () => {
            return identityContext.getPermission("workflows");
        });
        const outer = await identityContext.getPermission("workflows");

        expect(outer).toEqual({ name: "workflows", editor: true });
    });

    it("loads each identity's permissions once per request", async () => {
        const identityContext = createIdentityContext();

        await identityContext.getPermission("workflows");
        await identityContext.getPermissions("workflows");
        await identityContext.withIdentity(createIdentity("user-b"), async () => {
            await identityContext.getPermission("workflows");
            await identityContext.listPermissions();
        });
        await identityContext.getPermission("workflows");

        expect(authorizeCalls).toEqual(["user-a", "user-b"]);
    });

    it("loads again after the identity is replaced", async () => {
        const identityContext = createIdentityContext();
        await identityContext.getPermission("workflows");

        identityContext.setIdentity(createIdentity("user-b"));
        const replaced = await identityContext.getPermission("workflows");

        expect(replaced).toEqual({ name: "workflows", reassign: true });
        expect(authorizeCalls).toEqual(["user-a", "user-b"]);
    });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `yarn test packages/api-core/__tests__/security/withIdentityPermissions.test.ts 2>&1 | tail -50`
Expected: FAIL. "loads the permissions of the identity set by withIdentity" receives `{ name: "workflows", editor: true }` inside `withIdentity`; "loads each identity's permissions once per request" records `["user-a"]`. The other two pass already.

- [ ] **Step 3: Cache permissions per identity**

Replace `packages/api-core/src/features/security/authorization/AuthorizationContext/AuthorizationContext.ts` with:

```ts
import { AsyncLocalStorage } from "async_hooks";
import { AuthorizationContext as Abstraction, PermissionTransformer } from "./abstractions.js";
import { Authorizer } from "../Authorizer/index.js";
import type { SecurityPermission } from "~/types/security.js";
import { Identity } from "~/features/security/IdentityContext/index.js";

const authorizationEnabledStorage = new AsyncLocalStorage<boolean>();

/**
 * Loads and caches permissions per identity for the lifetime of the request. The cache is keyed by
 * identity, not a single slot: `IdentityContext.withIdentity` can switch the identity mid-request,
 * and permissions loaded for one identity must never answer for another.
 */
export class AuthorizationContext implements Abstraction.Interface {
    private readonly permissionsByIdentity = new Map<string, Promise<SecurityPermission[]>>();

    constructor(
        private getAuthorizers: () => Authorizer.Interface[],
        private getTransformers: () => PermissionTransformer.Interface[]
    ) {}

    loadPermissions(identity: Identity): Promise<SecurityPermission[]> {
        const key = `${identity.type}:${identity.id}`;
        const cached = this.permissionsByIdentity.get(key);
        if (cached) {
            return cached;
        }

        const loader = this.authorize(identity);
        this.permissionsByIdentity.set(key, loader);
        return loader;
    }

    isAuthorizationEnabled(): boolean {
        const override = authorizationEnabledStorage.getStore();
        return override ?? true;
    }

    withoutAuthorization<T>(cb: () => Promise<T>): Promise<T> {
        return authorizationEnabledStorage.run(false, cb);
    }

    clearPermissionsCache(): void {
        this.permissionsByIdentity.clear();
    }

    private async authorize(identity: Identity): Promise<SecurityPermission[]> {
        // Execute authorizers in sequence until one returns permissions
        const authorizers = this.getAuthorizers();
        for (const authorizer of authorizers) {
            const permissions = await authorizer.authorize(identity);
            if (Array.isArray(permissions)) {
                return this.transformPermissions(permissions);
            }
        }

        // No authorizer returned permissions
        return [];
    }

    private transformPermissions(permissions: SecurityPermission[]) {
        const transformers = this.getTransformers();
        if (transformers.length === 0) {
            return this.deduplicatePermissions(permissions);
        }

        const transformed = permissions
            .map(permission => {
                // A transformer can return one or multiple permissions, so we flatten the result.
                return transformers.map(t => t.execute(permission)).flat();
            })
            .flat();

        return this.deduplicatePermissions(transformed);
    }

    private deduplicatePermissions(permissions: SecurityPermission[]) {
        const seen = new Set<string>();

        return permissions.filter(permission => {
            const key = JSON.stringify(permission);
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }
}
```

Confirm with CodeGraph that `Identity` exposes `type` (`codegraph explore "Identity type getter IdentityContext/Identity.ts"`); it does (`IdentityData.type`, used by `RolesTeamsAuthorizer`).

- [ ] **Step 4: Run the test and api-core security tests**

Run: `yarn test packages/api-core/__tests__/security 2>&1 | tail -50` Expected: PASS.
Run: `yarn test:sql packages/api-core/__tests__/security 2>&1 | tail -50` Expected: PASS.

- [ ] **Step 5: Per-identity permissions in the test harness**

Replace `packages/api-core-testing/src/mocks/TestAuthorizer.ts` with:

```ts
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
 * evaluates another user through `IdentityContext.withIdentity`.
 */
export interface TestPermissionsHolder {
    list: SecurityPermission[];
    byIdentity?: Record<string, SecurityPermission[]>;
}

export const TestPermissions = new Abstraction<TestPermissionsHolder>("TestPermissions");

class TestAuthorizerImpl implements IAuthorizer {
    constructor(
        private permissions: TestPermissionsHolder,
        private identity: IdentityData | null
    ) {}

    async authorize(identity: Identity): Promise<SecurityPermission[] | null> {
        const own = this.permissions.byIdentity?.[identity.id];
        if (own) {
            return own;
        }
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
```

In `packages/api-headless-cms-testing/src/createCmsTestHandler.ts`:

1. Add to `CmsTestHandlerParams`, after `permissions?: SecurityPermission[];`:

```ts
    /**
     * Permissions of other identities, by identity id, for code that evaluates another user
     * through `IdentityContext.withIdentity`. The request identity still gets `permissions`.
     */
    permissionsByIdentity?: Record<string, SecurityPermission[]>;
```

2. In `setupRoot`, replace `container.registerInstance(TestPermissions, { list: permissions });` with:

```ts
        container.registerInstance(TestPermissions, {
            list: permissions,
            byIdentity: params.permissionsByIdentity
        });
```

- [ ] **Step 6: Run the dependent suites**

Run: `yarn test packages/api-workflows 2>&1 | tail -50` Expected: PASS (no behaviour change for one identity).
Run: `yarn test packages/api-headless-cms-workflows 2>&1 | tail -50` Expected: PASS.
Run: `yarn test:os packages/api-workflows 2>&1 | tail -50` Expected: PASS, or "not run" (A9).

- [ ] **Step 7: Commit**

Run the Global Constraints chain (build `@webiny/api-core`, `@webiny/api-core-testing`, `@webiny/api-headless-cms-testing`), then commit:

```
fix(api-core): cache permissions per identity so withIdentity evaluates the right user

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
