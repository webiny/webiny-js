import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { TenantSwitcherSource } from "@webiny/app-admin/features/tenantSwitcher/index.js";
import { IdentityContext } from "@webiny/app-admin/features/security/IdentityContext/index.js";
import { FeatureFlagsService } from "@webiny/app-admin/features/featureFlags/abstractions.js";
import { Identity } from "@webiny/app-admin/domain/Identity.js";
import { CurrentTenantRepository } from "~/admin/CurrentTenant/abstractions.js";
import { TenantListGateway } from "~/admin/TenantSwitcher/abstractions.js";
import { TenantSwitcherSourceDecorator } from "~/admin/TenantSwitcher/TenantSwitcherSourceDecorator.js";
import { isRootAdmin } from "~/admin/TenantSwitcher/isRootAdmin.js";
import { Tenant } from "~/shared/Tenant.js";

const tenantDto = (id: string, name: string, logo: string | null = null) =>
    Tenant.from({
        id,
        values: {
            name,
            logo,
            description: "",
            isInstalled: true,
            status: "enabled",
            extensions: {}
        }
    });

const createIdentity = (params: {
    currentTenant: string;
    tenants: { id: string; name: string }[];
    permissions: { name: string }[];
}) => {
    const names: Record<string, string> = { root: "Root", eu: "Acme Europe", us: "Acme US" };
    return Identity.createAuthenticated({
        id: "user",
        displayName: "User",
        type: "admin",
        permissions: params.permissions,
        currentTenant: { id: params.currentTenant, name: names[params.currentTenant] },
        // Without Cognito, every identity's default tenant is root.
        defaultTenant: { id: "root", name: "Root" },
        tenants: params.tenants
    } as any);
};

const createSource = (params: {
    identity: Identity;
    multiTenancy?: boolean;
    currentTenantLogo?: string | null;
}) => {
    const container = new Container();
    container.registerInstance(IdentityContext, {
        getIdentity: () => params.identity
    } as any);
    container.registerInstance(FeatureFlagsService, {
        getFlags: () => ({ isEnabled: () => params.multiTenancy ?? true })
    } as any);
    container.registerInstance(CurrentTenantRepository, {
        getTenant: () =>
            tenantDto(
                params.identity.currentTenant.id,
                params.identity.currentTenant.name,
                params.currentTenantLogo ?? null
            )
    } as any);
    container.registerInstance(TenantListGateway, {
        listTenants: async (search?: string) =>
            [tenantDto("eu", "Acme Europe", "eu.png"), tenantDto("us", "Acme US")].filter(
                tenant => !search || tenant.values.name.toLowerCase().includes(search)
            )
    });
    // The default source: the identity's own tenants.
    container.registerInstance(TenantSwitcherSource, {
        getCurrentTenant: async () => ({ ...params.identity.currentTenant, logo: null }),
        listTenants: async () => params.identity.tenants.map(tenant => ({ ...tenant, logo: null })),
        canSwitch: () => params.identity.canSwitchTenant,
        canSearch: () => false
    });
    container.registerDecorator(TenantSwitcherSourceDecorator);
    return container.resolve(TenantSwitcherSource);
};

const rootAdmin = (currentTenant = "root") =>
    createIdentity({
        currentTenant,
        tenants: [{ id: "root", name: "Root" }],
        permissions: [{ name: "*" }]
    });

describe("Tenant switcher source", () => {
    it("gives a root admin every tenant, Root first, with search", async () => {
        const source = createSource({ identity: rootAdmin() });

        expect(source.canSwitch()).toBe(true);
        expect(source.canSearch()).toBe(true);
        expect(await source.listTenants()).toEqual([
            { id: "root", name: "Root", logo: null },
            { id: "eu", name: "Acme Europe", logo: "eu.png" },
            { id: "us", name: "Acme US", logo: null }
        ]);
        expect((await source.listTenants("us")).map(tenant => tenant.id)).toEqual(["us"]);
        expect((await source.listTenants("roo")).map(tenant => tenant.id)).toEqual(["root"]);
    });

    it("gives a root admin nothing to switch to without multi-tenancy on the license", async () => {
        const source = createSource({ identity: rootAdmin(), multiTenancy: false });

        expect(source.canSwitch()).toBe(false);
        expect(source.canSearch()).toBe(false);
    });

    it("treats a sub-tenant user with full access in that tenant as a regular user", async () => {
        const identity = createIdentity({
            currentTenant: "eu",
            tenants: [{ id: "eu", name: "Acme Europe" }],
            permissions: [{ name: "*" }]
        });
        const source = createSource({ identity, currentTenantLogo: "eu.png" });

        expect(isRootAdmin(identity, true)).toBe(false);
        expect(source.canSwitch()).toBe(false);
        expect(await source.getCurrentTenant()).toEqual({
            id: "eu",
            name: "Acme Europe",
            logo: "eu.png"
        });
    });

    it("gives a user linked to several tenants their own tenants, the current one with its logo", async () => {
        const identity = createIdentity({
            currentTenant: "eu",
            tenants: [
                { id: "eu", name: "Acme Europe" },
                { id: "us", name: "Acme US" }
            ],
            permissions: [{ name: "cms.contentEntry" }]
        });
        const source = createSource({ identity, currentTenantLogo: "eu.png" });

        expect(source.canSwitch()).toBe(true);
        expect(source.canSearch()).toBe(false);
        expect(await source.listTenants()).toEqual([
            { id: "eu", name: "Acme Europe", logo: "eu.png" },
            { id: "us", name: "Acme US", logo: null }
        ]);
    });
});
