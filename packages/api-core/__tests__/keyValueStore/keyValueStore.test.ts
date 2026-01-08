import { describe, it, expect, beforeEach } from "vitest";
import { Container } from "@webiny/di";
import { getStorageOps } from "@webiny/project-utils/testing/environment";
import { TenantContext } from "~/features/tenancy/TenantContext/index.js";
import { TenancyFeature } from "~/features/tenancy/TenancyFeature.js";
import type {
    Tenant,
    TenancyStorageOperations as ITenancyStorageOperations
} from "~/types/tenancy.js";
import { GlobalKeyValueStore, KeyValueStore } from "~/features/keyValueStore/index.js";
import { ApiCoreStorageOperations } from "~/types/core";
import { KeyValueStoreFeature } from "~/features/keyValueStore/feature.js";

const createTenant = (input: Pick<Tenant, "id" | "name" | "parent">): Tenant => {
    return {
        ...input,
        isInstalled: true,
        createdOn: new Date().toISOString(),
        description: "Root tenant",
        settings: {},
        tags: [],
        status: "active",
        savedOn: new Date().toISOString()
    };
};

// ============================================================================
// Mock Tenancy Storage Operations
// ============================================================================

class MockTenancyStorageOperations implements ITenancyStorageOperations {
    private tenants = new Map<string, Tenant>();

    constructor() {
        // Seed root tenant
        this.tenants.set(
            "root",
            createTenant({
                id: "root",
                name: "Root Tenant",
                parent: null
            })
        );
    }

    async getTenantById(id: string): Promise<Tenant | null> {
        return this.tenants.get(id) || null;
    }

    async getTenantsByIds(ids: readonly string[]): Promise<Tenant[]> {
        return ids.map(id => this.tenants.get(id)!);
    }

    async listTenants(): Promise<Tenant[]> {
        return Array.from(this.tenants.values());
    }

    async createTenant(tenant: Tenant): Promise<Tenant> {
        this.tenants.set(tenant.id, tenant);
        return tenant;
    }

    async updateTenant(tenant: Tenant): Promise<Tenant> {
        this.tenants.set(tenant.id, tenant);
        return tenant;
    }

    async deleteTenant(id: string): Promise<void> {
        this.tenants.delete(id);
    }
}

// ============================================================================
// Tests
// ============================================================================

describe("KeyValueStore Feature", () => {
    let container: Container;
    let tenantContext: TenantContext.Interface;
    let keyValueStore: KeyValueStore.Interface;
    let globalKeyValueStore: GlobalKeyValueStore.Interface;

    beforeEach(() => {
        container = new Container();
        const apiCoreStorage = getStorageOps<ApiCoreStorageOperations>("apiCore");
        const { keyValueStorageOperations } = apiCoreStorage.storageOperations;

        // Create mocks
        const mockTenancyStorage = new MockTenancyStorageOperations();

        // Register real TenancyFeature with mock storage
        TenancyFeature.register(container, mockTenancyStorage);
        KeyValueStoreFeature.register(container, keyValueStorageOperations);

        // Resolve services
        tenantContext = container.resolve(TenantContext);
        keyValueStore = container.resolve(KeyValueStore);
        globalKeyValueStore = container.resolve(GlobalKeyValueStore);

        // Set initial tenant
        tenantContext.setTenant(createTenant({ id: "root", name: "Root Tenant", parent: null }));
    });

    describe("GlobalKeyValueStore", () => {
        describe("set and get", () => {
            it("should store and retrieve a value with default scope", async () => {
                const result = await globalKeyValueStore.set("config/theme", { mode: "dark" });
                expect(result.isOk()).toBe(true);

                const getResult = await globalKeyValueStore.get("config/theme");
                expect(getResult.isOk()).toBe(true);
                expect(getResult.value).toEqual({ mode: "dark" });
            });

            it("should store and retrieve a value with explicit scope", async () => {
                const result = await globalKeyValueStore.set(
                    "deployment/config",
                    { region: "us-east-1" },
                    { scope: "infrastructure" }
                );
                expect(result.isOk()).toBe(true);

                const getResult = await globalKeyValueStore.get("deployment/config", {
                    scope: "infrastructure"
                });
                expect(getResult.isOk()).toBe(true);
                expect(getResult.value).toEqual({ region: "us-east-1" });
            });

            it("should return error when key is not found", async () => {
                const result = await globalKeyValueStore.get("nonexistent/key");
                expect(result.isFail()).toBe(true);
                expect(result.error.code).toBe("KeyValueStore/KeyNotFound");
            });

            it("should not find key in different scope", async () => {
                await globalKeyValueStore.set("shared/key", { value: 1 }, { scope: "scope1" });

                const result = await globalKeyValueStore.get("shared/key", { scope: "scope2" });
                expect(result.isFail()).toBe(true);
                expect(result.error.code).toBe("KeyValueStore/KeyNotFound");
            });
        });

        describe("delete", () => {
            it("should delete a value", async () => {
                await globalKeyValueStore.set("temp/data", { temp: true });

                const deleteResult = await globalKeyValueStore.delete("temp/data");
                expect(deleteResult.isOk()).toBe(true);

                const getResult = await globalKeyValueStore.get("temp/data");
                expect(getResult.isFail()).toBe(true);
                expect(getResult.error.code).toBe("KeyValueStore/KeyNotFound");
            });

            it("should delete a value from specific scope", async () => {
                await globalKeyValueStore.set("data", { value: 1 }, { scope: "test" });

                const deleteResult = await globalKeyValueStore.delete("data", { scope: "test" });
                expect(deleteResult.isOk()).toBe(true);

                const getResult = await globalKeyValueStore.get("data", { scope: "test" });
                expect(getResult.isFail()).toBe(true);
            });
        });

        describe("list", () => {
            it("should list values by prefix in default scope", async () => {
                await globalKeyValueStore.set("app/config/theme", { mode: "dark" });
                await globalKeyValueStore.set("app/config/language", { lang: "en" });
                await globalKeyValueStore.set("app/settings/user", { name: "John" });

                const result = await globalKeyValueStore.list("app/config/");
                expect(result.isOk()).toBe(true);
                expect(result.value).toHaveLength(2);

                const keys = result.value.map(r => r.key).sort();
                expect(keys).toEqual(["app/config/language", "app/config/theme"]);
            });

            it("should list values by prefix in specific scope", async () => {
                await globalKeyValueStore.set("feature/a", { enabled: true }, { scope: "tenant1" });
                await globalKeyValueStore.set(
                    "feature/b",
                    { enabled: false },
                    { scope: "tenant1" }
                );
                await globalKeyValueStore.set("feature/c", { enabled: true }, { scope: "tenant2" });

                const result = await globalKeyValueStore.list("feature/", { scope: "tenant1" });
                expect(result.isOk()).toBe(true);
                expect(result.value).toHaveLength(2);

                const keys = result.value.map(r => r.key).sort();
                expect(keys).toEqual(["feature/a", "feature/b"]);
            });

            it("should return empty array when no matches found", async () => {
                const result = await globalKeyValueStore.list("nonexistent/");
                expect(result.isOk()).toBe(true);
                expect(result.value).toEqual([]);
            });

            it("should list all values with empty prefix", async () => {
                await globalKeyValueStore.set("key1", { value: 1 }, { scope: "test" });
                await globalKeyValueStore.set("key2", { value: 2 }, { scope: "test" });

                const result = await globalKeyValueStore.list("", { scope: "test" });
                expect(result.isOk()).toBe(true);
                expect(result.value).toHaveLength(2);
            });
        });

        describe("update", () => {
            it("should update an existing value", async () => {
                await globalKeyValueStore.set("counter", { count: 1 });

                const updateResult = await globalKeyValueStore.set("counter", { count: 2 });
                expect(updateResult.isOk()).toBe(true);

                const getResult = await globalKeyValueStore.get("counter");
                expect(getResult.isOk()).toBe(true);
                expect(getResult.value).toEqual({ count: 2 });
            });
        });
    });

    describe("KeyValueStore (Tenant-aware)", () => {
        describe("set and get", () => {
            it("should store and retrieve value scoped to current tenant", async () => {
                const result = await keyValueStore.set("FileManager/Settings", {
                    theme: "dark",
                    layout: "grid"
                });
                expect(result.isOk()).toBe(true);

                const getResult = await keyValueStore.get("FileManager/Settings");
                expect(getResult.isOk()).toBe(true);
                expect(getResult.value).toEqual({ theme: "dark", layout: "grid" });
            });

            it("should isolate data between tenants", async () => {
                const tenant1 = createTenant({ id: "tenant1", name: "Tenant 1", parent: "root" });
                const tenant2 = createTenant({ id: "tenant2", name: "Tenant 2", parent: "root" });

                // Set value in tenant1
                tenantContext.setTenant(tenant1);
                await keyValueStore.set("config/app", { version: "1.0" });

                // Set different value in tenant2
                tenantContext.setTenant(tenant2);
                await keyValueStore.set("config/app", { version: "2.0" });

                // Verify tenant1 has its own value
                tenantContext.setTenant(tenant1);
                const result1 = await keyValueStore.get("config/app");
                expect(result1.isOk()).toBe(true);
                expect(result1.value).toEqual({ version: "1.0" });

                // Verify tenant2 has its own value
                tenantContext.setTenant(tenant2);
                const result2 = await keyValueStore.get("config/app");
                expect(result2.isOk()).toBe(true);
                expect(result2.value).toEqual({ version: "2.0" });
            });

            it("should return error when key not found in current tenant", async () => {
                const result = await keyValueStore.get("nonexistent/key");
                expect(result.isFail()).toBe(true);
                expect(result.error.code).toBe("KeyValueStore/KeyNotFound");
            });
        });

        describe("delete", () => {
            it("should delete value from current tenant only", async () => {
                const tenant1 = createTenant({ id: "tenant1", name: "Tenant 1", parent: "root" });
                const tenant2 = createTenant({ id: "tenant2", name: "Tenant 2", parent: "root" });

                // Set same key in both tenants
                tenantContext.setTenant(tenant1);
                await keyValueStore.set("shared/key", { tenant: "1" });

                tenantContext.setTenant(tenant2);
                await keyValueStore.set("shared/key", { tenant: "2" });

                // Delete from tenant1
                tenantContext.setTenant(tenant1);
                const deleteResult = await keyValueStore.delete("shared/key");
                expect(deleteResult.isOk()).toBe(true);

                // Verify deleted from tenant1
                const getResult1 = await keyValueStore.get("shared/key");
                expect(getResult1.isFail()).toBe(true);

                // Verify still exists in tenant2
                tenantContext.setTenant(tenant2);
                const getResult2 = await keyValueStore.get("shared/key");
                expect(getResult2.isOk()).toBe(true);
                expect(getResult2.value).toEqual({ tenant: "2" });
            });
        });

        describe("list", () => {
            it("should list values by prefix for current tenant only", async () => {
                const tenant1 = createTenant({ id: "tenant1", name: "Tenant 1", parent: "root" });

                tenantContext.setTenant(tenant1);
                await keyValueStore.set("plugin/a/config", { enabled: true });
                await keyValueStore.set("plugin/b/config", { enabled: false });
                await keyValueStore.set("other/config", { value: 1 });

                const result = await keyValueStore.list("plugin/");
                expect(result.isOk()).toBe(true);
                expect(result.value).toHaveLength(2);

                const keys = result.value.map(r => r.key).sort();
                expect(keys).toEqual(["plugin/a/config", "plugin/b/config"]);
            });

            it("should not return values from other tenants", async () => {
                const tenant1 = createTenant({ id: "tenant1", name: "Tenant 1", parent: "root" });
                const tenant2 = createTenant({ id: "tenant2", name: "Tenant 2", parent: "root" });

                // Add data to tenant1
                tenantContext.setTenant(tenant1);
                await keyValueStore.set("app/config", { value: 1 });

                // List from tenant2 should be empty
                tenantContext.setTenant(tenant2);
                const result = await keyValueStore.list("app/");
                expect(result.isOk()).toBe(true);
                expect(result.value).toEqual([]);
            });
        });

        describe("integration with GlobalKeyValueStore", () => {
            it("should not conflict between tenant-scoped and global-scoped keys", async () => {
                // Set value in tenant scope
                await keyValueStore.set("shared/key", { source: "tenant" });

                // Set value in global scope with same key
                await globalKeyValueStore.set("shared/key", { source: "global" });

                // Verify tenant-scoped value
                const tenantResult = await keyValueStore.get("shared/key");
                expect(tenantResult.isOk()).toBe(true);
                expect(tenantResult.value).toEqual({ source: "tenant" });

                // Verify global-scoped value
                const globalResult = await globalKeyValueStore.get("shared/key");
                expect(globalResult.isOk()).toBe(true);
                expect(globalResult.value).toEqual({ source: "global" });
            });
        });
    });
});
