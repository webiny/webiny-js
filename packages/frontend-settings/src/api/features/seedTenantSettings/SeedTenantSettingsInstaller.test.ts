import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { AppInstaller } from "@webiny/api-core/features/tenancy/InstallTenant/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import { SeedTenantSettingsInstaller } from "./SeedTenantSettingsInstaller.js";
import { FRONTEND_SETTINGS_KEY } from "~/shared/constants.js";

const tenant = (id: string) => ({ id, name: id }) as Tenant;

/** One record per tenant, written to whichever tenant is current: the shape of the real store. */
function setup(stored: Record<string, Record<string, any>> = {}) {
    let current = tenant("root");

    class FakeTenantContext implements TenantContext.Interface {
        setTenant(next: Tenant) {
            current = next;
        }
        getTenant() {
            return current;
        }
        async withRootTenant<T>(cb: () => T) {
            return this.withTenant(tenant("root"), async () => cb());
        }
        async withEachTenant<T>(tenants: Tenant[], cb: (t: Tenant) => Promise<T>) {
            const results: T[] = [];
            for (const each of tenants) {
                results.push(await this.withTenant(each, cb));
            }
            return results;
        }
        async withTenant<T>(next: Tenant, cb: (t: Tenant) => Promise<T>) {
            const previous = current;
            current = next;
            try {
                return await cb(next);
            } finally {
                current = previous;
            }
        }
    }

    class FakeKeyValueStore implements KeyValueStore.Interface {
        async get<T>(key: string) {
            return Result.ok(stored[current.id]?.[key] as T);
        }
        async set(key: string, value: unknown) {
            stored[current.id] = { ...stored[current.id], [key]: value };
            return Result.ok();
        }
        async delete(key: string) {
            delete stored[current.id]?.[key];
            return Result.ok();
        }
    }

    const container = new Container();
    container.register(
        TenantContext.createImplementation({ implementation: FakeTenantContext, dependencies: [] })
    );
    container.register(
        KeyValueStore.createImplementation({ implementation: FakeKeyValueStore, dependencies: [] })
    );
    container.register(SeedTenantSettingsInstaller);

    const context = container.resolve(TenantContext);
    const installer = container.resolve(AppInstaller);
    // As InstallTenantUseCase runs installers: inside the new tenant's context.
    const install = (id: string) =>
        context.withTenant(tenant(id), next => installer.install(next, {}));

    return { stored, install, installer, context };
}

const KEY = FRONTEND_SETTINGS_KEY;
const WB_KEY = "WebsiteBuilder/Settings";
const rootSettings = {
    domain: "https://www.example.com",
    starterKits: [{ id: "next", label: "Next.js", config: "WEBINY_API=..." }]
};

describe("Frontend SeedTenantSettingsInstaller", () => {
    it("copies root's frontend URL and starter kits to the new tenant", async () => {
        const { stored, install } = setup({ root: { [KEY]: rootSettings } });

        await install("acme");

        expect(stored.acme[KEY]).toEqual(rootSettings);
        expect(stored.root[KEY]).toEqual(rootSettings);
    });

    it("falls back to root's Website Builder preview domain", async () => {
        const { stored, install } = setup({
            root: { [WB_KEY]: { previewDomain: "https://legacy.example.com" } }
        });

        await install("acme");

        expect(stored.acme[KEY]).toEqual({ domain: "https://legacy.example.com" });
    });

    it("runs on every install, without being asked for", () => {
        const { installer } = setup();

        expect(installer.alwaysRun).toBe(true);
        expect(installer.dependsOn).toEqual([]);
    });

    it("writes nothing when root has no frontend URL", async () => {
        const { stored, install } = setup({ root: { [KEY]: { domain: "" } } });

        await install("acme");

        expect(stored.acme).toBeUndefined();
    });

    it("keeps a frontend URL the tenant already has", async () => {
        const own = { domain: "https://acme.example.com" };
        const { stored, install } = setup({ root: { [KEY]: rootSettings }, acme: { [KEY]: own } });

        await install("acme");

        expect(stored.acme[KEY]).toEqual(own);
    });

    it("leaves root alone when root itself is installed", async () => {
        const { stored, install } = setup({ root: { [KEY]: rootSettings } });

        await install("root");

        expect(stored.root[KEY]).toEqual(rootSettings);
    });

    it("removes the copy on rollback, from the new tenant only", async () => {
        const { stored, install, installer, context } = setup({ root: { [KEY]: rootSettings } });

        await install("acme");
        await context.withTenant(tenant("acme"), next => installer.uninstall(next));

        expect(stored.acme[KEY]).toBeUndefined();
        expect(stored.root[KEY]).toEqual(rootSettings);
    });
});
