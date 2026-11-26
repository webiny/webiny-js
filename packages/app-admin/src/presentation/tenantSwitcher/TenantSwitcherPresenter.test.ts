import { describe, expect, it, vi } from "vitest";
import { Container } from "@webiny/di";
import { TenantSwitcherSource } from "~/features/tenantSwitcher/abstractions.js";
import { TenantContext } from "~/features/tenancy/abstractions.js";
import { TenantSwitcherPresenter as Abstraction } from "./abstractions.js";
import { TenantSwitcherPresenter } from "./TenantSwitcherPresenter.js";

const tenants = [
    { id: "eu", name: "Acme Europe", logo: null },
    { id: "us", name: "Acme US", logo: null }
];

const createPresenter = (canSwitch: boolean) => {
    const setTenant = vi.fn();
    const listTenants = vi.fn(async (search?: string) =>
        tenants.filter(tenant => !search || tenant.name.toLowerCase().includes(search))
    );

    const container = new Container();
    container.registerInstance(TenantSwitcherSource, {
        getCurrentTenant: async () => tenants[0],
        listTenants,
        canSwitch: () => canSwitch,
        canSearch: () => canSwitch
    });
    container.registerInstance(TenantContext, {
        getCurrentTenant: () => "eu",
        setTenant,
        onTenantChange: () => () => {}
    });
    container.register(TenantSwitcherPresenter).inSingletonScope();

    return { presenter: container.resolve(Abstraction), setTenant, listTenants };
};

describe("TenantSwitcherPresenter", () => {
    it("loads the current tenant and the tenants to switch to", async () => {
        const { presenter } = createPresenter(true);

        await presenter.init();

        expect(presenter.vm.current?.id).toBe("eu");
        expect(presenter.vm.tenants.map(tenant => tenant.id)).toEqual(["eu", "us"]);
        expect(presenter.vm.canSwitch).toBe(true);
    });

    it("doesn't list tenants for a user who can't switch", async () => {
        const { presenter, listTenants } = createPresenter(false);

        await presenter.init();

        expect(presenter.vm.current?.id).toBe("eu");
        expect(listTenants).not.toHaveBeenCalled();
    });

    it("searches after the user stops typing", async () => {
        vi.useFakeTimers();
        const { presenter, listTenants } = createPresenter(true);
        await presenter.init();
        listTenants.mockClear();

        presenter.setSearch("u");
        presenter.setSearch("us");
        await vi.advanceTimersByTimeAsync(300);

        expect(listTenants).toHaveBeenCalledTimes(1);
        expect(listTenants).toHaveBeenCalledWith("us");
        expect(presenter.vm.tenants.map(tenant => tenant.id)).toEqual(["us"]);
        vi.useRealTimers();
    });

    it("switches to another tenant, and does nothing for the current one", async () => {
        const { presenter, setTenant } = createPresenter(true);
        await presenter.init();

        presenter.switchTo("eu");
        expect(setTenant).not.toHaveBeenCalled();

        presenter.switchTo("us");
        expect(setTenant).toHaveBeenCalledWith("us");
    });
});
