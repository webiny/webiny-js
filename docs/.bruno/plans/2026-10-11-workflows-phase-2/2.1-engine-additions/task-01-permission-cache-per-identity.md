### Task 1: Cache permissions per identity and tenant, add `withAuthorization`, per-identity test permissions

R49, R69, R70, D134 point 6. `AuthorizationContext` keeps one permission slot per request, so inside `IdentityContext.withIdentity(other, ...)` every permission check still answers for the outer identity (and if the first load happens inside the callback, the outer identity gets the other user's permissions for the rest of the request). And inside `withoutAuthorization` every check answers `*`, even under `withIdentity`, so a read check for another user run from a background task would pass for everyone. Phase 2's candidate read check (R48, R67) and phase 5's task triggers (D87) need both fixed.

This task is a platform change in `api-core` and lands as two clearly labelled commits at the start of 2.1 (D134 point 6): first `fix(api-core)`, then `test(api-core-testing)` for the harness. Both run the full api-core suite (DDB and SQL) and the neighbouring package suites.

**Files:**
- Modify: `packages/api-core/src/features/security/authorization/AuthorizationContext/abstractions.ts`
- Modify: `packages/api-core/src/features/security/authorization/AuthorizationContext/AuthorizationContext.ts`
- Modify: `packages/api-core/src/features/security/authorization/AuthorizationContext/feature.ts`
- Modify: `packages/api-core/src/features/security/IdentityContext/abstractions.ts`
- Modify: `packages/api-core/src/features/security/IdentityContext/IdentityContext.ts`
- Create: `packages/api-core/__tests__/security/withIdentityPermissions.test.ts`
- Modify: `packages/api-core-testing/src/mocks/TestAuthorizer.ts`
- Modify: `packages/api-headless-cms-testing/src/createCmsTestHandler.ts`

**Interfaces:**
- Consumes: `Authorizer`, `PermissionTransformer`, `TenantContext` (`~/features/tenancy/TenantContext/index.js`), `IdentityContext`, `AuthenticatedIdentity`, `Identity`.
- Produces:
  - `IAuthorizationContext.withAuthorization<T>(cb: () => Promise<T>): Promise<T>` and `IIdentityContext.withAuthorization<T>(cb: () => Promise<T>): Promise<T>`: run `cb` with authorization enabled, also inside `withoutAuthorization`.
  - `AuthorizationContext` caches per identity object instance and tenant id (`WeakMap<Identity, Map<tenantKey, Promise>>`); concurrent loads for one identity and tenant share one promise; a rejected load is evicted; `clearPermissionsCache()` drops everything. Constructor: `(getAuthorizers, getTransformers, getTenantId: () => string | null)`.
  - `TestPermissionsHolder { list: SecurityPermission[]; byIdentity?: Record<string, SecurityPermission[]> }`. `TestAuthorizer.authorize(identity)`: the request identity (same id as `TestIdentity`, or anonymous when `TestIdentity` is `null`) keeps the previous behaviour; any other `api-key` identity gets `null` (left to api-core's `ApiKeyAuthorizer`); any other identity gets `byIdentity[identity.id] ?? []` (R70).
  - `CmsTestHandlerParams.permissionsByIdentity?: Record<string, SecurityPermission[]>`, passed as `TestPermissions.byIdentity`.

Existing fakes of `IIdentityContext` (`api-core/__tests__/security/permissions/createPermissions.test.ts`, `api-aco/__tests__/ai.createFolder.test.ts`, `ai-powerups/__tests__/features/AdminAssistant/AdminAssistantUseCase.test.ts`, `bug-reporter/__tests__/api/SubmitBugReportUseCase.test.ts`) are cast (`as IdentityContext.Interface` / `as unknown as ...`), so the new method breaks none of them; confirm with `grep -rlE "IdentityContext\.Interface|IIdentityContext" packages/*/__tests__` before Step 3.

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
import { TenantContext } from "~/features/tenancy/TenantContext/index.js";
import type { SecurityPermission } from "~/types/security.js";
import type { Tenant } from "~/types/tenancy.js";

/** Custom permission names: AACL filtering only touches built-in app prefixes (cms, fm, ...). */
const PERMISSIONS_BY_USER: Record<string, SecurityPermission[]> = {
    "user-a": [{ name: "workflows", editor: true }],
    "user-b": [{ name: "workflows", reassign: true }]
};

const authorizeCalls: string[] = [];
let failNextLoad = false;

class PerUserAuthorizerImpl implements Authorizer.Interface {
    async authorize(identity: Identity): Promise<SecurityPermission[] | null> {
        authorizeCalls.push(identity.id);
        if (failNextLoad) {
            failNextLoad = false;
            throw new Error("Storage is down.");
        }
        return PERMISSIONS_BY_USER[identity.id] ?? [];
    }
}

const PerUserAuthorizer = Authorizer.createImplementation({
    implementation: PerUserAuthorizerImpl,
    dependencies: []
});

const toTenant = (id: string): Tenant => {
    return { id } as Tenant;
};

/** Only `getTenant` and `setTenant` are used by the permission cache. */
class StubTenantContext implements TenantContext.Interface {
    private tenant: Tenant = toTenant("root");

    getTenant(): Tenant {
        return this.tenant;
    }

    setTenant(tenant: Tenant): void {
        this.tenant = tenant;
    }

    async withRootTenant<T>(cb: () => T): Promise<T> {
        return cb();
    }

    async withEachTenant<TReturn>(
        tenants: Tenant[],
        cb: (tenant: Tenant) => Promise<TReturn>
    ): Promise<TReturn[]> {
        const results: TReturn[] = [];
        for (const tenant of tenants) {
            results.push(await cb(tenant));
        }
        return results;
    }

    async withTenant<TReturn>(
        tenant: Tenant,
        cb: (tenant: Tenant) => Promise<TReturn>
    ): Promise<TReturn> {
        return cb(tenant);
    }
}

const createIdentity = (id: string): AuthenticatedIdentity => {
    return new AuthenticatedIdentity({ id, displayName: id, type: "admin" });
};

interface IdentityContextSetup {
    identityContext: IdentityContext.Interface;
    tenantContext: StubTenantContext;
}

const createIdentityContext = (): IdentityContextSetup => {
    const container = new Container();
    const license = License.fromLicenseDto(createTestWcpLicense());
    const tenantContext = new StubTenantContext();

    BuildParamsFeature.register(container);
    FeatureFlagsFeature.register(container);
    WcpContextFeature.register(container, new WcpLicenseProviderImpl(license));
    container.registerInstance(TenantContext, tenantContext);
    AuthorizationContextFeature.register(container);
    IdentityContextFeature.register(container);
    container.register(PerUserAuthorizer);

    const identityContext = container.resolve(IdentityContext);
    identityContext.setIdentity(createIdentity("user-a"));
    return { identityContext, tenantContext };
};

describe("permissions under withIdentity", () => {
    beforeEach(() => {
        authorizeCalls.length = 0;
        failNextLoad = false;
    });

    it("loads the permissions of the identity set by withIdentity", async () => {
        const { identityContext } = createIdentityContext();

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
        const { identityContext } = createIdentityContext();

        await identityContext.withIdentity(createIdentity("user-b"), () => {
            return identityContext.getPermission("workflows");
        });
        const outer = await identityContext.getPermission("workflows");

        expect(outer).toEqual({ name: "workflows", editor: true });
    });

    it("loads each identity's permissions once per request", async () => {
        const { identityContext } = createIdentityContext();
        const userB = createIdentity("user-b");

        await identityContext.getPermission("workflows");
        await identityContext.getPermissions("workflows");
        await identityContext.withIdentity(userB, async () => {
            await identityContext.getPermission("workflows");
            await identityContext.listPermissions();
        });
        await identityContext.withIdentity(userB, () => identityContext.listPermissions());
        await identityContext.getPermission("workflows");

        expect(authorizeCalls).toEqual(["user-a", "user-b"]);
    });

    it("never shares permissions between two identity objects with the same id (R69)", async () => {
        const { identityContext } = createIdentityContext();

        await identityContext.withIdentity(createIdentity("user-b"), () => {
            return identityContext.listPermissions();
        });
        await identityContext.withIdentity(createIdentity("user-b"), () => {
            return identityContext.listPermissions();
        });

        expect(authorizeCalls).toEqual(["user-b", "user-b"]);
    });

    it("loads again for the same identity in another tenant (R69)", async () => {
        const { identityContext, tenantContext } = createIdentityContext();

        await identityContext.getPermission("workflows");
        tenantContext.setTenant(toTenant("sub-tenant"));
        await identityContext.getPermission("workflows");
        tenantContext.setTenant(toTenant("root"));
        await identityContext.getPermission("workflows");

        expect(authorizeCalls).toEqual(["user-a", "user-a"]);
    });

    it("loads again after the identity is replaced", async () => {
        const { identityContext } = createIdentityContext();
        await identityContext.getPermission("workflows");

        identityContext.setIdentity(createIdentity("user-b"));
        const replaced = await identityContext.getPermission("workflows");

        expect(replaced).toEqual({ name: "workflows", reassign: true });
        expect(authorizeCalls).toEqual(["user-a", "user-b"]);
    });

    it("does not keep a failed load, so the next check loads again", async () => {
        const { identityContext } = createIdentityContext();
        failNextLoad = true;

        await expect(identityContext.getPermission("workflows")).rejects.toThrow(
            "Storage is down."
        );
        const retried = await identityContext.getPermission("workflows");

        expect(retried).toEqual({ name: "workflows", editor: true });
        expect(authorizeCalls).toEqual(["user-a", "user-a"]);
    });
});

describe("withAuthorization", () => {
    beforeEach(() => {
        authorizeCalls.length = 0;
        failNextLoad = false;
    });

    it("checks real permissions inside withoutAuthorization", async () => {
        const { identityContext } = createIdentityContext();

        const result = await identityContext.withoutAuthorization(async () => {
            const bypassed = await identityContext.getPermission("unknown-permission");
            const enforced = await identityContext.withAuthorization(() => {
                return identityContext.withIdentity(createIdentity("user-b"), () => {
                    return identityContext.getPermission("workflows");
                });
            });
            const bypassedAgain = await identityContext.getPermission("unknown-permission");
            return { bypassed, enforced, bypassedAgain };
        });

        expect(result.bypassed).toEqual({ name: "*" });
        expect(result.enforced).toEqual({ name: "workflows", reassign: true });
        expect(result.bypassedAgain).toEqual({ name: "*" });
        expect(identityContext.isAuthorizationEnabled()).toBe(true);
    });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `yarn test packages/api-core/__tests__/security/withIdentityPermissions.test.ts 2>&1 | tail -50`
Expected: FAIL. Before the fix every test except "loads again after the identity is replaced" fails: the single slot answers `editor` inside `withIdentity` and keeps `reassign` for the outer identity once user-b loaded first; identities and tenants are not told apart; "does not keep a failed load" times out (today the authorizer throws inside an `async` Promise executor, so the cached promise never settles); `withAuthorization` is not a function.

- [ ] **Step 3: Add `withAuthorization` and cache per identity and tenant**

In `packages/api-core/src/features/security/authorization/AuthorizationContext/abstractions.ts`, add to `IAuthorizationContext` after `withoutAuthorization`:

```ts
    /** Runs `cb` with authorization enabled, also inside `withoutAuthorization`. */
    withAuthorization<T>(cb: () => Promise<T>): Promise<T>;
```

Replace `packages/api-core/src/features/security/authorization/AuthorizationContext/AuthorizationContext.ts` with:

```ts
import { AsyncLocalStorage } from "async_hooks";
import { AuthorizationContext as Abstraction, PermissionTransformer } from "./abstractions.js";
import { Authorizer } from "../Authorizer/index.js";
import type { SecurityPermission } from "~/types/security.js";
import { Identity } from "~/features/security/IdentityContext/index.js";

const authorizationEnabledStorage = new AsyncLocalStorage<boolean>();

/** Tenant key used when no tenant is set yet (before the tenant is resolved). */
const NO_TENANT = "";

type PermissionsByTenant = Map<string, Promise<SecurityPermission[]>>;

/**
 * Loads and caches permissions per identity object and tenant for the lifetime of the request.
 * `IdentityContext.withIdentity` can switch the identity mid-request and `TenantContext` the
 * tenant, so permissions loaded for one identity or tenant never answer for another. Keying by the
 * object (not by id or a fingerprint) means two identities with the same id but a different
 * context never share an entry (R69). A failed load is evicted, so the next check retries.
 */
export class AuthorizationContext implements Abstraction.Interface {
    private permissionsByIdentity = new WeakMap<Identity, PermissionsByTenant>();

    constructor(
        private getAuthorizers: () => Authorizer.Interface[],
        private getTransformers: () => PermissionTransformer.Interface[],
        private getTenantId: () => string | null
    ) {}

    loadPermissions(identity: Identity): Promise<SecurityPermission[]> {
        let byTenant = this.permissionsByIdentity.get(identity);
        if (!byTenant) {
            byTenant = new Map();
            this.permissionsByIdentity.set(identity, byTenant);
        }

        const tenantKey = this.getTenantId() ?? NO_TENANT;
        const cached = byTenant.get(tenantKey);
        if (cached) {
            return cached;
        }

        const loader = this.authorize(identity);
        byTenant.set(tenantKey, loader);
        const cache = byTenant;
        loader.catch(() => {
            if (cache.get(tenantKey) === loader) {
                cache.delete(tenantKey);
            }
        });
        return loader;
    }

    isAuthorizationEnabled(): boolean {
        const override = authorizationEnabledStorage.getStore();
        return override ?? true;
    }

    withoutAuthorization<T>(cb: () => Promise<T>): Promise<T> {
        return authorizationEnabledStorage.run(false, cb);
    }

    withAuthorization<T>(cb: () => Promise<T>): Promise<T> {
        return authorizationEnabledStorage.run(true, cb);
    }

    clearPermissionsCache(): void {
        this.permissionsByIdentity = new WeakMap();
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

Replace `packages/api-core/src/features/security/authorization/AuthorizationContext/feature.ts` with:

```ts
import { createFeature } from "@webiny/feature/api";
import { AuthorizationContext } from "./AuthorizationContext.js";
import { AuthorizationContext as Abstraction, PermissionTransformer } from "./abstractions.js";
import { Authorizer } from "~/features/security/authorization/Authorizer/index.js";
import { TenantContext } from "~/features/tenancy/TenantContext/index.js";

export const AuthorizationContextFeature = createFeature({
    name: "AuthorizationContext",
    register(container) {
        const getAuthorizers = () => container.resolveAll(Authorizer);
        const getTransformers = () => container.resolveAll(PermissionTransformer);
        // Read lazily: the tenant is set after registration, and slim test containers have none.
        const getTenantId = (): string | null => {
            const [tenantContext] = container.resolveAll(TenantContext);
            return tenantContext?.getTenant()?.id ?? null;
        };

        const authorizationContext = new AuthorizationContext(
            getAuthorizers,
            getTransformers,
            getTenantId
        );

        container.registerInstance(Abstraction, authorizationContext);
    }
});
```

(`TenantContextFeature` registers `TenantContext` in singleton scope, so `resolveAll` returns the request's instance; the existing `withoutAuthorization.test.ts` registers no tenancy and keeps working with the `NO_TENANT` key. Confirm both with `codegraph explore "TenantContextFeature AuthorizationContextFeature withoutAuthorization.test"`.)

In `packages/api-core/src/features/security/IdentityContext/abstractions.ts`, add to `IIdentityContext` after `withoutAuthorization`:

```ts
    /**
     * Runs `cb` with authorization enabled, also inside `withoutAuthorization`. Combine with
     * `withIdentity` to evaluate another user's real permissions from a background task.
     */
    withAuthorization<T>(cb: () => Promise<T>): Promise<T>;
```

In `packages/api-core/src/features/security/IdentityContext/IdentityContext.ts`, add after `withoutAuthorization`:

```ts
    withAuthorization<T>(cb: () => Promise<T>): Promise<T> {
        return this.authorizationContext.withAuthorization(cb);
    }
```

- [ ] **Step 4: Run the full api-core suite**

Run: `yarn test packages/api-core 2>&1 | tail -50` Expected: PASS.
Run: `yarn test:sql packages/api-core 2>&1 | tail -50` Expected: PASS.

- [ ] **Step 5: Commit the api-core fix**

Run the Global Constraints chain (build `@webiny/api-core`), then commit:

```
fix(api-core): cache permissions per identity and tenant and add withAuthorization

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```

- [ ] **Step 6: Per-identity permissions in the test harness**

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
 * evaluates another user through `IdentityContext.withIdentity`. Other identities not listed get
 * no permissions.
 */
export interface TestPermissionsHolder {
    list: SecurityPermission[];
    byIdentity?: Record<string, SecurityPermission[]>;
}

export const TestPermissions = new Abstraction<TestPermissionsHolder>("TestPermissions");

/** An identity that may carry embedded permissions (API keys, as `ApiKeyAuthenticator` builds them). */
interface IdentityWithPermissions {
    permissions?: unknown;
}

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
            const embedded = (identity as IdentityWithPermissions).permissions;
            if (identity.type === "api-key" && Array.isArray(embedded)) {
                return embedded as SecurityPermission[];
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
```

In `packages/api-headless-cms-testing/src/createCmsTestHandler.ts`:

1. Add to `CmsTestHandlerParams`, after `permissions?: SecurityPermission[];`:

```ts
    /**
     * Permissions of other identities, by identity id, for code that evaluates another user
     * through `IdentityContext.withIdentity`. The request identity gets `permissions`; other
     * identities not listed here get none.
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

- [ ] **Step 7: Run the dependent and neighbouring suites**

Every package's tests go through `AuthorizationContext` and the changed `TestAuthorizer`, so run (each `2>&1 | tail -50`):

- `yarn test packages/api-core` and `yarn test:sql packages/api-core`
- `yarn test packages/api-workflows` and `yarn test:os packages/api-workflows`
- `yarn test packages/api-headless-cms-workflows`
- `yarn test packages/api-headless-cms`
- `yarn test packages/api-aco`
- `yarn test packages/api-website-builder`
- `yarn test packages/background-tasks`
- `yarn test packages/api-scheduler`

Expected: PASS. Record any `test:os` run that cannot start as "not run" (A9). A failure that comes from a test relying on an unlisted identity inheriting the request's permissions is fixed in that test by listing the identity in `permissionsByIdentity`, not by loosening `TestAuthorizer`.

- [ ] **Step 8: Commit the harness**

Run the Global Constraints chain (build `@webiny/api-core-testing`, `@webiny/api-headless-cms-testing`), then commit:

```
test(api-core-testing): grant other identities their own test permissions

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
