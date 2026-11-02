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

const createIdentityContext = (overrideTenantContext?: StubTenantContext): IdentityContextSetup => {
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
    if (overrideTenantContext) {
        container.registerInstance(TenantContext, overrideTenantContext);
    }

    const identityContext = container.resolve(IdentityContext);
    identityContext.setIdentity(createIdentity("user-a"));
    return { identityContext, tenantContext: overrideTenantContext ?? tenantContext };
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

    it("shares one load between concurrent checks for the same identity and tenant", async () => {
        const { identityContext } = createIdentityContext();

        const [first, second, third] = await Promise.all([
            identityContext.getPermission("workflows"),
            identityContext.getPermission("workflows"),
            identityContext.listPermissions()
        ]);

        expect(first).toEqual({ name: "workflows", editor: true });
        expect(second).toEqual(first);
        expect(third).toEqual([{ name: "workflows", editor: true }]);
        expect(authorizeCalls).toEqual(["user-a"]);
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

    it("reads the tenant from the registration that resolve() returns", async () => {
        const override = new StubTenantContext();
        const { identityContext, tenantContext } = createIdentityContext(override);
        expect(tenantContext).toBe(override);

        await identityContext.getPermission("workflows");
        override.setTenant(toTenant("sub-tenant"));
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

    it("restores the previous state when the callback throws", async () => {
        const { identityContext } = createIdentityContext();

        await identityContext.withoutAuthorization(async () => {
            await expect(
                identityContext.withAuthorization(async () => {
                    expect(identityContext.isAuthorizationEnabled()).toBe(true);
                    throw new Error("Callback failed.");
                })
            ).rejects.toThrow("Callback failed.");

            expect(identityContext.isAuthorizationEnabled()).toBe(false);
        });

        expect(identityContext.isAuthorizationEnabled()).toBe(true);
    });
});
