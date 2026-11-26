import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { IdentityContext } from "~/features/security/IdentityContext/abstractions.js";
import { Identity } from "~/domain/Identity.js";
import { TenantSwitcherSource } from "./abstractions.js";
import { IdentityTenantSwitcherSource } from "./IdentityTenantSwitcherSource.js";

const createSource = (params: { currentTenant: string; tenants: string[] }) => {
    const names: Record<string, string> = { root: "Root", eu: "Acme Europe", us: "Acme US" };
    const identity = Identity.createAuthenticated({
        id: "user",
        displayName: "User",
        type: "admin",
        permissions: [],
        currentTenant: { id: params.currentTenant, name: names[params.currentTenant] },
        defaultTenant: { id: params.tenants[0], name: names[params.tenants[0]] },
        tenants: params.tenants.map(id => ({ id, name: names[id] }))
    } as any);

    const container = new Container();
    container.registerInstance(IdentityContext, { getIdentity: () => identity } as any);
    container.register(IdentityTenantSwitcherSource);
    return container.resolve(TenantSwitcherSource);
};

describe("IdentityTenantSwitcherSource", () => {
    it("offers a user linked to several tenants those tenants", async () => {
        const source = createSource({ currentTenant: "eu", tenants: ["eu", "us"] });

        expect(source.canSwitch()).toBe(true);
        const tenants = await source.listTenants();
        expect(tenants.map(tenant => tenant.id)).toEqual(["eu", "us"]);
    });

    it("offers nothing to a user of one tenant", async () => {
        const source = createSource({ currentTenant: "eu", tenants: ["eu"] });

        expect(source.canSwitch()).toBe(false);
    });

    it("gives a root user who ended up in another tenant a way back to Root", async () => {
        const source = createSource({ currentTenant: "eu", tenants: ["root"] });

        expect(source.canSwitch()).toBe(true);
        const tenants = await source.listTenants();
        expect(tenants.map(tenant => tenant.id)).toEqual(["root", "eu"]);
    });

    it("offers nothing to a root user in the root tenant", async () => {
        const source = createSource({ currentTenant: "root", tenants: ["root"] });

        expect(source.canSwitch()).toBe(false);
    });
});
