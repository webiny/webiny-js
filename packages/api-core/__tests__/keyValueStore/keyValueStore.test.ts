import { describe, it, expect, beforeEach } from "vitest";
import { Container } from "@webiny/di";
import { getStorageOps } from "~/testing/environment.js";
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

        describe("list", () => {
            const collection = "chats";

            const listKeys = async (params: Parameters<typeof globalKeyValueStore.list>[0]) => {
                const result = await globalKeyValueStore.list(params);
                expect(result.isOk()).toBe(true);
                return result.value.items.map(item => item.key);
            };

            it("should list the members of a collection, ordered by key", async () => {
                await globalKeyValueStore.set("chat:b", { id: "b" }, { collection });
                await globalKeyValueStore.set("chat:a", { id: "a" }, { collection });
                await globalKeyValueStore.set("chat:c", { id: "c" }, { collection: "other" });

                const result = await globalKeyValueStore.list({ collection });
                expect(result.isOk()).toBe(true);
                expect(result.value).toEqual({
                    items: [
                        { key: "chat:a", value: { id: "a" } },
                        { key: "chat:b", value: { id: "b" } }
                    ],
                    cursor: null
                });
            });

            it("should not list records written without a collection", async () => {
                await globalKeyValueStore.set("FileManager/File/1/Metadata", { id: "1" });
                await globalKeyValueStore.set("chat:a", { id: "a" }, { collection });

                expect(await listKeys({ collection })).toEqual(["chat:a"]);
            });

            it("should return an empty page for a collection with no members", async () => {
                const result = await globalKeyValueStore.list({ collection: "empty" });
                expect(result.value).toEqual({ items: [], cursor: null });
            });

            it("should take a record out of its collection when a write names none", async () => {
                await globalKeyValueStore.set("chat:a", 1, { collection });
                await globalKeyValueStore.set("chat:a", 2);

                expect(await listKeys({ collection })).toEqual([]);
                expect((await globalKeyValueStore.get("chat:a")).value).toEqual(2);
            });

            it("should move a record to the collection its latest write names", async () => {
                await globalKeyValueStore.set("chat:a", 1, { collection });
                await globalKeyValueStore.set("chat:a", 2, { collection: "archived" });

                expect(await listKeys({ collection })).toEqual([]);
                expect(await listKeys({ collection: "archived" })).toEqual(["chat:a"]);
            });

            it("should not list deleted records", async () => {
                await globalKeyValueStore.set("chat:a", 1, { collection });
                await globalKeyValueStore.set("chat:b", 2, { collection });
                await globalKeyValueStore.delete("chat:a");

                expect(await listKeys({ collection })).toEqual(["chat:b"]);
            });

            it("should leave out expired records", async () => {
                await globalKeyValueStore.set("session:live", 1, { collection });
                await globalKeyValueStore.set("session:expired", 2, {
                    collection,
                    expiresAt: new Date(Date.now() - 60_000)
                });

                expect(await listKeys({ collection })).toEqual(["session:live"]);
            });

            it("should only list the collection in the given scope", async () => {
                await globalKeyValueStore.set("item:1", 1, { scope: "one", collection });
                await globalKeyValueStore.set("item:2", 2, { scope: "two", collection });

                expect(await listKeys({ scope: "one", collection })).toEqual(["item:1"]);
            });

            it("should store and list an empty key", async () => {
                const setResult = await globalKeyValueStore.set("", 0, { collection });
                expect(setResult.isOk()).toBe(true);
                await globalKeyValueStore.set("a", 1, { collection });

                const result = await globalKeyValueStore.list({ collection });
                expect(result.value.items).toEqual([
                    { key: "", value: 0 },
                    { key: "a", value: 1 }
                ]);
            });

            it("should page through a collection with a cursor", async () => {
                for (const id of ["1", "2", "3", "4", "5"]) {
                    await globalKeyValueStore.set(`page:${id}`, id, { collection });
                }

                const first = await globalKeyValueStore.list({ collection, limit: 2 });
                expect(first.value.items.map(item => item.key)).toEqual(["page:1", "page:2"]);
                expect(first.value.cursor).toEqual(expect.any(String));

                const second = await globalKeyValueStore.list({
                    collection,
                    limit: 2,
                    cursor: first.value.cursor!
                });
                expect(second.value.items.map(item => item.key)).toEqual(["page:3", "page:4"]);

                const third = await globalKeyValueStore.list({
                    collection,
                    limit: 2,
                    cursor: second.value.cursor!
                });
                expect(third.value.items.map(item => item.key)).toEqual(["page:5"]);
                expect(third.value.cursor).toBeNull();
            });

            it("should page in reverse, and keep the direction in the cursor", async () => {
                for (const id of ["1", "2", "3"]) {
                    await globalKeyValueStore.set(`page:${id}`, id, { collection });
                }

                const first = await globalKeyValueStore.list({
                    collection,
                    limit: 2,
                    reverse: true
                });
                expect(first.value.items.map(item => item.key)).toEqual(["page:3", "page:2"]);

                const second = await globalKeyValueStore.list({
                    collection,
                    limit: 2,
                    cursor: first.value.cursor!
                });
                expect(second.value.items.map(item => item.key)).toEqual(["page:1"]);
                expect(second.value.cursor).toBeNull();
            });

            it("should return no cursor when the last page is exactly full", async () => {
                await globalKeyValueStore.set("full:1", 1, { collection });
                await globalKeyValueStore.set("full:2", 2, { collection });

                const result = await globalKeyValueStore.list({ collection, limit: 2 });
                expect(result.value.items).toHaveLength(2);
                expect(result.value.cursor).toBeNull();
            });

            it("should not skip a record written between pages", async () => {
                await globalKeyValueStore.set("live:1", 1, { collection });
                await globalKeyValueStore.set("live:3", 3, { collection });
                await globalKeyValueStore.set("live:4", 4, { collection });

                const first = await globalKeyValueStore.list({ collection, limit: 1 });
                await globalKeyValueStore.set("live:2", 2, { collection });

                const rest = await globalKeyValueStore.list({
                    collection,
                    cursor: first.value.cursor!
                });
                expect(rest.value.items.map(item => item.key)).toEqual([
                    "live:2",
                    "live:3",
                    "live:4"
                ]);
            });

            it("should order keys by their bytes, uppercase before lowercase", async () => {
                for (const key of ["b", "B", "a", "A", "a-b", "aB"]) {
                    await globalKeyValueStore.set(key, key, { collection });
                }

                const keys: string[] = [];
                let cursor: string | undefined;
                do {
                    const page = await globalKeyValueStore.list({ collection, limit: 2, cursor });
                    keys.push(...page.value.items.map(item => item.key));
                    cursor = page.value.cursor ?? undefined;
                } while (cursor);

                expect(keys).toEqual(["A", "B", "a", "a-b", "aB", "b"]);
            });

            it("should reject a cursor the store did not return", async () => {
                const result = await globalKeyValueStore.list({
                    collection,
                    cursor: "not-a-cursor"
                });
                expect(result.isFail()).toBe(true);
                expect(result.error.code).toBe("KeyValueStore/InvalidCursor");
            });

            it("should reject a cursor from another collection", async () => {
                await globalKeyValueStore.set("a", 1, { collection });
                await globalKeyValueStore.set("b", 2, { collection });
                const first = await globalKeyValueStore.list({ collection, limit: 1 });

                const result = await globalKeyValueStore.list({
                    collection: "other",
                    cursor: first.value.cursor!
                });
                expect(result.isFail()).toBe(true);
                expect(result.error.code).toBe("KeyValueStore/InvalidCursor");
            });

            it("should keep a scope and collection apart when the names contain #", async () => {
                await globalKeyValueStore.set("x", 1, { scope: "a#b", collection: "c" });
                await globalKeyValueStore.set("y", 2, { scope: "a", collection: "b#c" });

                expect(await listKeys({ scope: "a#b", collection: "c" })).toEqual(["x"]);
                expect(await listKeys({ scope: "a", collection: "b#c" })).toEqual(["y"]);
            });

            it("should reject a collection member whose key is over 1000 bytes", async () => {
                const fits = await globalKeyValueStore.set("k".repeat(1000), 1, { collection });
                expect(fits.isOk()).toBe(true);

                // 334 three-byte characters are 1002 bytes.
                const tooLong = await globalKeyValueStore.set("€".repeat(334), 1, { collection });
                expect(tooLong.isFail()).toBe(true);
                expect(tooLong.error.code).toBe("KeyValueStore/KeyTooLong");

                // The limit is the index's, so a key outside every collection can be longer.
                const outside = await globalKeyValueStore.set("k".repeat(1500), 1);
                expect(outside.isOk()).toBe(true);
            });

            it("should reject a collection name over 1000 bytes", async () => {
                const result = await globalKeyValueStore.set("a", 1, {
                    collection: "c".repeat(1001)
                });
                expect(result.isFail()).toBe(true);
                expect(result.error.code).toBe("KeyValueStore/InvalidCollection");
            });

            it("should reject an empty collection name", async () => {
                const setResult = await globalKeyValueStore.set("a", 1, { collection: "" });
                expect(setResult.isFail()).toBe(true);
                expect(setResult.error.code).toBe("KeyValueStore/InvalidCollection");

                const listResult = await globalKeyValueStore.list({ collection: "" });
                expect(listResult.isFail()).toBe(true);
                expect(listResult.error.code).toBe("KeyValueStore/InvalidCollection");
            });
        });
    });

    describe("GlobalKeyValueStore conditional writes", () => {
        const past = () => new Date(Date.now() - 5000);
        const future = () => new Date(Date.now() + 60_000);
        const CONDITION_FAILED = "KeyValueStore/ConditionFailed";

        describe("set with ifNotExists", () => {
            it("writes when there is no record", async () => {
                const result = await globalKeyValueStore.set("lock/a", "p1", { ifNotExists: true });
                expect(result.isOk()).toBe(true);

                const stored = await globalKeyValueStore.get("lock/a");
                expect(stored.value).toBe("p1");
            });

            it("does not write over a live record", async () => {
                await globalKeyValueStore.set("lock/b", "p1", { expiresAt: future() });

                const result = await globalKeyValueStore.set("lock/b", "p2", { ifNotExists: true });
                expect(result.error?.code).toBe(CONDITION_FAILED);

                const stored = await globalKeyValueStore.get("lock/b");
                expect(stored.value).toBe("p1");
            });

            it("does not write over a record without an expiry", async () => {
                await globalKeyValueStore.set("lock/c", "p1");

                const result = await globalKeyValueStore.set("lock/c", "p2", { ifNotExists: true });
                expect(result.error?.code).toBe(CONDITION_FAILED);
            });

            it("takes over an expired record", async () => {
                await globalKeyValueStore.set("lock/d", "p1", { expiresAt: past() });

                const result = await globalKeyValueStore.set("lock/d", "p2", {
                    ifNotExists: true,
                    expiresAt: future()
                });
                expect(result.isOk()).toBe(true);

                const stored = await globalKeyValueStore.get("lock/d");
                expect(stored.value).toBe("p2");
            });

            it("lets exactly one of several racing writes through", async () => {
                const owners = ["p1", "p2", "p3", "p4", "p5"];
                const attempts = owners.map(owner => {
                    return globalKeyValueStore.set("lock/race", owner, { ifNotExists: true });
                });
                const results = await Promise.all(attempts);

                const winners = results.filter(result => result.isOk());
                expect(winners).toHaveLength(1);
            });

            it("is separate per scope", async () => {
                await globalKeyValueStore.set("lock/e", "p1", { scope: "a", ifNotExists: true });

                const result = await globalKeyValueStore.set("lock/e", "p2", {
                    scope: "b",
                    ifNotExists: true
                });
                expect(result.isOk()).toBe(true);
            });

            it("puts the record in the collection it names", async () => {
                await globalKeyValueStore.set("lock/f", "p1", {
                    ifNotExists: true,
                    collection: "locks"
                });

                const listed = await globalKeyValueStore.list({ collection: "locks" });
                expect(listed.value.items).toEqual([{ key: "lock/f", value: "p1" }]);
            });
        });

        describe("set with ifValue", () => {
            it("replaces a record whose value matches", async () => {
                await globalKeyValueStore.set("lock/g", "p1", { expiresAt: future() });

                const result = await globalKeyValueStore.set("lock/g", "p1-renewed", {
                    ifValue: "p1",
                    expiresAt: future()
                });
                expect(result.isOk()).toBe(true);

                const stored = await globalKeyValueStore.get("lock/g");
                expect(stored.value).toBe("p1-renewed");
            });

            it("does not replace a record whose value differs", async () => {
                await globalKeyValueStore.set("lock/h", "p1", { expiresAt: future() });

                const result = await globalKeyValueStore.set("lock/h", "p2", { ifValue: "p2" });
                expect(result.error?.code).toBe(CONDITION_FAILED);

                const stored = await globalKeyValueStore.get("lock/h");
                expect(stored.value).toBe("p1");
            });

            it("does not replace an expired record", async () => {
                await globalKeyValueStore.set("lock/i", "p1", { expiresAt: past() });

                const result = await globalKeyValueStore.set("lock/i", "p1", {
                    ifValue: "p1",
                    expiresAt: future()
                });
                expect(result.error?.code).toBe(CONDITION_FAILED);
            });

            it("does not create a missing record", async () => {
                const result = await globalKeyValueStore.set("lock/missing", "p1", {
                    ifValue: "p1"
                });
                expect(result.error?.code).toBe(CONDITION_FAILED);

                const stored = await globalKeyValueStore.get("lock/missing");
                expect(stored.isFail()).toBe(true);
            });

            it("does not match a value of another type", async () => {
                await globalKeyValueStore.set("lock/j", 1, { expiresAt: future() });

                const result = await globalKeyValueStore.set("lock/j", 2, { ifValue: "1" });
                expect(result.error?.code).toBe(CONDITION_FAILED);
            });

            it("treats collections like any set: kept when named, left otherwise", async () => {
                await globalKeyValueStore.set("lock/k", "p1", { collection: "locks" });
                await globalKeyValueStore.set("lock/l", "p1", { collection: "locks" });

                await globalKeyValueStore.set("lock/k", "p2", {
                    ifValue: "p1",
                    collection: "locks"
                });
                await globalKeyValueStore.set("lock/l", "p2", { ifValue: "p1" });

                const listed = await globalKeyValueStore.list({ collection: "locks" });
                expect(listed.value.items).toEqual([{ key: "lock/k", value: "p2" }]);
            });
        });

        it("refuses ifNotExists and ifValue together", async () => {
            const result = await globalKeyValueStore.set("lock/m", "p1", {
                ifNotExists: true,
                ifValue: "p1"
            });
            expect(result.error?.code).toBe("KeyValueStore/InvalidCondition");
        });

        describe("delete with ifValue", () => {
            it("deletes a record whose value matches", async () => {
                await globalKeyValueStore.set("lock/n", "p1", { collection: "locks" });

                const result = await globalKeyValueStore.delete("lock/n", { ifValue: "p1" });
                expect(result.isOk()).toBe(true);

                const stored = await globalKeyValueStore.get("lock/n");
                expect(stored.isFail()).toBe(true);
                const listed = await globalKeyValueStore.list({ collection: "locks" });
                expect(listed.value.items).toEqual([]);
            });

            it("does not delete a record whose value differs", async () => {
                await globalKeyValueStore.set("lock/o", "p1");

                const result = await globalKeyValueStore.delete("lock/o", { ifValue: "p2" });
                expect(result.error?.code).toBe(CONDITION_FAILED);

                const stored = await globalKeyValueStore.get("lock/o");
                expect(stored.value).toBe("p1");
            });

            it("treats an expired record as absent", async () => {
                await globalKeyValueStore.set("lock/p", "p1", { expiresAt: past() });

                const result = await globalKeyValueStore.delete("lock/p", { ifValue: "p1" });
                expect(result.error?.code).toBe(CONDITION_FAILED);
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
            it("should list a collection of the current tenant only", async () => {
                const tenant1 = createTenant({ id: "tenant1", name: "Tenant 1", parent: "root" });
                const tenant2 = createTenant({ id: "tenant2", name: "Tenant 2", parent: "root" });

                tenantContext.setTenant(tenant1);
                await keyValueStore.set("chat:1", { tenant: "1" }, { collection: "chats" });

                tenantContext.setTenant(tenant2);
                await keyValueStore.set("chat:2", { tenant: "2" }, { collection: "chats" });

                const result = await keyValueStore.list({ collection: "chats" });
                expect(result.isOk()).toBe(true);
                expect(result.value.items).toEqual([{ key: "chat:2", value: { tenant: "2" } }]);
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
