import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { LocalStorage } from "@webiny/app/exports/admin/local-storage.js";
import { TenantContext } from "@webiny/app-admin/exports/admin/tenancy.js";
import { DashboardLayoutGateway } from "~/Dashboard/dashboardLayout/repository/abstractions.js";
import { DashboardLayoutRepository as RepositoryAbstraction } from "~/Dashboard/dashboardLayout/repository/abstractions.js";
import { DashboardLayoutRepository } from "~/Dashboard/dashboardLayout/repository/DashboardLayoutRepository.js";
import type { DashboardLayoutData } from "~/Dashboard/dashboardLayout/types.js";

const LAYOUT: DashboardLayoutData = { columns: [["a"], ["b"]], hidden: ["c"], columnCount: 2 };

function setup(stored: DashboardLayoutData | null) {
    const storage = new Map<string, unknown>();
    const saved: DashboardLayoutData[] = [];
    let tenant = "root";

    const container = new Container();
    container.registerInstance(LocalStorage, {
        get: <T>(key: string) => storage.get(key) as T | undefined,
        set: (key: string, value: unknown) => {
            storage.set(key, value);
        },
        remove: (key: string) => {
            storage.delete(key);
        },
        clear: () => storage.clear(),
        keys: () => [...storage.keys()]
    });
    container.registerInstance(TenantContext, {
        getCurrentTenant: () => tenant,
        setTenant: () => {},
        onTenantChange: () => () => {}
    });
    container.registerInstance(DashboardLayoutGateway, {
        get: async () => stored,
        save: async (layout: DashboardLayoutData) => {
            saved.push(layout);
            return layout;
        }
    });
    container.register(DashboardLayoutRepository);
    const repository = container.resolve(RepositoryAbstraction);

    const setTenant = (id: string) => {
        tenant = id;
    };

    return { repository, storage, saved, setTenant };
}

describe("DashboardLayoutRepository", () => {
    it("caches the fetched layout per tenant and user", async () => {
        const { repository, setTenant } = setup(LAYOUT);
        expect(repository.getCached("user-1")).toBeNull();

        await repository.fetch("user-1");

        expect(repository.getCached("user-1")).toEqual(LAYOUT);
        expect(repository.getCached("user-2")).toBeNull();
        setTenant("acme");
        expect(repository.getCached("user-1")).toBeNull();
    });

    it("clears the cache when nothing is stored", async () => {
        const { repository } = setup(null);
        await repository.save("user-1", LAYOUT);

        await repository.fetch("user-1");

        expect(repository.getCached("user-1")).toBeNull();
    });

    it("caches a saved layout and sends it to the API", async () => {
        const { repository, saved } = setup(null);

        await repository.save("user-1", LAYOUT);

        expect(repository.getCached("user-1")).toEqual(LAYOUT);
        expect(saved).toEqual([LAYOUT]);
    });

    it("ignores a cache entry written by another version", () => {
        const { repository, storage } = setup(null);
        storage.set("dashboard:root:user-1", { version: 0, layout: LAYOUT });

        expect(repository.getCached("user-1")).toBeNull();
    });
});
