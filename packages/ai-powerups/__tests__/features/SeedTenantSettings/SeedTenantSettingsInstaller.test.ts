import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { AppInstaller } from "@webiny/api-core/features/tenancy/InstallTenant/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { KeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import { SeedTenantSettingsInstaller } from "~/api/features/SeedTenantSettings/SeedTenantSettingsInstaller.js";
import { AI_POWER_UPS_SETTINGS } from "~/api/constants.js";

const tenant = (id: string) => ({ id, name: id }) as Tenant;

/** One record per tenant, written to whichever tenant is current: the shape of the real store. */
function setup(stored: Record<string, Record<string, unknown>> = {}) {
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

const rootSettings = {
    connections: { items: [{ id: "anthropic", apiKeyEncrypted: "enc:abc", apiKey: "****abc" }] },
    modelRoles: { standard: { connectionId: "anthropic", model: "claude-opus-5-5" } },
    readerPersonas: { items: [{ id: "dev", name: "Developer" }] }
};

describe("SeedTenantSettingsInstaller", () => {
    it("copies the root tenant's stored settings to the new tenant as they are", async () => {
        const { stored, install } = setup({ root: { [AI_POWER_UPS_SETTINGS]: rootSettings } });

        await install("acme");

        expect(stored.acme[AI_POWER_UPS_SETTINGS]).toEqual(rootSettings);
        expect(stored.root[AI_POWER_UPS_SETTINGS]).toEqual(rootSettings);
    });

    it("runs on every install, without being asked for", () => {
        const { installer } = setup();

        expect(installer.alwaysRun).toBe(true);
        expect(installer.dependsOn).toEqual([]);
    });

    it("writes nothing when root has never saved its settings", async () => {
        const { stored, install } = setup();

        await install("acme");

        expect(stored.acme).toBeUndefined();
    });

    it("keeps settings the tenant already has", async () => {
        const own = { modelRoles: { standard: { connectionId: "openai", model: "gpt" } } };
        const { stored, install } = setup({
            root: { [AI_POWER_UPS_SETTINGS]: rootSettings },
            acme: { [AI_POWER_UPS_SETTINGS]: own }
        });

        await install("acme");

        expect(stored.acme[AI_POWER_UPS_SETTINGS]).toEqual(own);
    });

    it("leaves root alone when root itself is installed", async () => {
        const { stored, install } = setup({ root: { [AI_POWER_UPS_SETTINGS]: rootSettings } });

        await install("root");

        expect(stored.root[AI_POWER_UPS_SETTINGS]).toEqual(rootSettings);
    });

    it("removes the copy on rollback, from the new tenant only", async () => {
        const { stored, install, installer, context } = setup({
            root: { [AI_POWER_UPS_SETTINGS]: rootSettings }
        });

        await install("acme");
        await context.withTenant(tenant("acme"), next => installer.uninstall(next));

        expect(stored.acme[AI_POWER_UPS_SETTINGS]).toBeUndefined();
        expect(stored.root[AI_POWER_UPS_SETTINGS]).toEqual(rootSettings);
    });
});
