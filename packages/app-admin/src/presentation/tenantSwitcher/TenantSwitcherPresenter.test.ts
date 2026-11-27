import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { TenantSwitcherSource } from "~/features/tenantSwitcher/abstractions.js";
import { RecentTenantsRepository } from "~/features/tenantSwitcher/abstractions.js";
import { TenantContext } from "~/features/tenancy/abstractions.js";
import { TenantSwitcherPresenter as Abstraction } from "./abstractions.js";
import { TenantSwitcherPresenter } from "./TenantSwitcherPresenter.js";

type Tenant = TenantSwitcherSource.Tenant;

const tenants: Tenant[] = [
    { id: "eu", name: "Acme Europe", logo: null },
    { id: "us", name: "Acme US", logo: null }
];

const root: Tenant = { id: "root", name: "Root", logo: null };

// Root first, then ten tenants by name: what a root admin's list looks like.
const manyTenants: Tenant[] = [
    root,
    ...["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"].map(letter => {
        return { id: letter, name: `Tenant ${letter.toUpperCase()}`, logo: null };
    })
];

interface CreatePresenterParams {
    canSwitch?: boolean;
    canSearch?: boolean;
    list?: Tenant[];
    current?: Tenant;
    recent?: Tenant[];
}

const createPresenter = (params: CreatePresenterParams = {}) => {
    const canSwitch = params.canSwitch ?? true;
    const canSearch = params.canSearch ?? canSwitch;
    const list = params.list ?? tenants;
    const current = params.current ?? tenants[0];
    let recent = params.recent ?? [];

    const setTenant = vi.fn();
    const listTenants = vi.fn(async (search?: string) =>
        list.filter(tenant => !search || tenant.name.toLowerCase().includes(search))
    );
    const remember = vi.fn((tenant: Tenant) => {
        recent = [tenant, ...recent.filter(other => other.id !== tenant.id)];
    });

    const container = new Container();
    container.registerInstance(TenantSwitcherSource, {
        getCurrentTenant: async () => current,
        listTenants,
        canSwitch: () => canSwitch,
        canSearch: () => canSearch
    });
    container.registerInstance(TenantContext, {
        getCurrentTenant: () => current.id,
        setTenant,
        onTenantChange: () => () => {}
    });
    container.registerInstance(RecentTenantsRepository, {
        list: () => recent,
        remember
    });
    container.register(TenantSwitcherPresenter).inSingletonScope();

    return { presenter: container.resolve(Abstraction), setTenant, listTenants, remember };
};

const shownIds = (presenter: Abstraction.Interface) => {
    return presenter.vm.tenants.map(tenant => tenant.id);
};

describe("TenantSwitcherPresenter", () => {
    it("loads the current tenant and the tenants to switch to", async () => {
        const { presenter } = createPresenter();

        await presenter.init();

        expect(presenter.vm.current?.id).toBe("eu");
        expect(presenter.vm.tenants.map(tenant => tenant.id)).toEqual(["eu", "us"]);
        expect(presenter.vm.canSwitch).toBe(true);
    });

    it("doesn't list tenants for a user who can't switch", async () => {
        const { presenter, listTenants } = createPresenter({ canSwitch: false });

        await presenter.init();

        expect(presenter.vm.current?.id).toBe("eu");
        expect(listTenants).not.toHaveBeenCalled();
    });

    it("searches after the user stops typing", async () => {
        vi.useFakeTimers();
        const { presenter, listTenants } = createPresenter();
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

    it("loads once, however many components call init()", async () => {
        const { presenter, listTenants } = createPresenter();

        await Promise.all([presenter.init(), presenter.init()]);
        await presenter.init();

        expect(listTenants).toHaveBeenCalledTimes(1);
    });

    it("shows no tenants when the list request fails", async () => {
        const { presenter, listTenants } = createPresenter();
        listTenants.mockRejectedValueOnce(new Error("Not authorized."));

        await presenter.init();

        expect(presenter.vm.tenants).toEqual([]);
        expect(presenter.vm.loading).toBe(false);
    });

    it("gives each tenant its initials", async () => {
        const { presenter } = createPresenter();

        await presenter.init();

        expect(presenter.vm.tenants.map(tenant => tenant.initials)).toEqual(["AE", "AU"]);
        expect(presenter.vm.current?.isRoot).toBe(false);
    });

    it("switches to another tenant, and does nothing for the current one", async () => {
        const { presenter, setTenant } = createPresenter();
        await presenter.init();

        presenter.switchTo("eu");
        expect(setTenant).not.toHaveBeenCalled();

        presenter.switchTo("us");
        expect(setTenant).toHaveBeenCalledWith("us");
    });

    describe("short list for users who can search every tenant", () => {
        it("shows Root and the first five by name when nothing was switched to yet", async () => {
            const { presenter } = createPresenter({ list: manyTenants, current: root });

            await presenter.init();

            expect(shownIds(presenter)).toEqual(["root", "a", "b", "c", "d", "e"]);
        });

        it("shows the current tenant second, then the recent ones, then the rest by name", async () => {
            const { presenter } = createPresenter({
                list: manyTenants,
                current: manyTenants[7],
                recent: [manyTenants[9], manyTenants[3]]
            });

            await presenter.init();

            expect(shownIds(presenter)).toEqual(["root", "g", "i", "c", "a", "b"]);
        });

        it("shows a recent tenant that isn't in the loaded list", async () => {
            const elsewhere = { id: "z", name: "Tenant Z", logo: null };
            const { presenter } = createPresenter({
                list: manyTenants,
                current: root,
                recent: [elsewhere]
            });

            await presenter.init();

            expect(shownIds(presenter)).toEqual(["root", "z", "a", "b", "c", "d"]);
        });

        it("shows the listed name over a recent tenant's stored one", async () => {
            const renamed = { id: "c", name: "Old name", logo: null };
            const { presenter } = createPresenter({
                list: manyTenants,
                current: root,
                recent: [renamed]
            });

            await presenter.init();

            expect(presenter.vm.tenants[1].name).toBe("Tenant C");
        });

        it("shows every result of a search", async () => {
            vi.useFakeTimers();
            const { presenter } = createPresenter({ list: manyTenants, current: root });
            await presenter.init();

            presenter.setSearch("tenant");
            await vi.advanceTimersByTimeAsync(300);

            expect(shownIds(presenter)).toHaveLength(10);
            vi.useRealTimers();
        });

        it("remembers the tenant it switches to", async () => {
            const { presenter, remember } = createPresenter({ list: manyTenants, current: root });
            await presenter.init();

            presenter.switchTo("b");

            expect(remember).toHaveBeenCalledWith(manyTenants[2]);
        });

        it("gives users without search their whole list", async () => {
            const { presenter } = createPresenter({
                list: manyTenants,
                current: root,
                canSearch: false
            });

            await presenter.init();

            expect(shownIds(presenter)).toHaveLength(11);
        });
    });
});
