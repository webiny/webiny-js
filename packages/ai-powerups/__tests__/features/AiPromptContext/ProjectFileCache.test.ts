import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { GlobalKeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { ProjectFileCache as ProjectFileCacheAbstraction } from "~/api/features/AiPromptContext/abstractions.js";
import { ProjectFileCache } from "~/api/features/AiPromptContext/ProjectFileCache.js";

/** In-memory store that keeps every scope separate, like the real repository. */
class InMemoryGlobalKeyValueStore {
    public readonly values = new Map<string, unknown>();

    async get(key: string, options?: { scope?: string }) {
        const value = this.values.get(`${options?.scope ?? "global"}:${key}`);
        return Result.ok(value);
    }

    async set(key: string, value: unknown, options?: { scope?: string }) {
        this.values.set(`${options?.scope ?? "global"}:${key}`, value);
        return Result.ok();
    }

    async delete(key: string, options?: { scope?: string }) {
        this.values.delete(`${options?.scope ?? "global"}:${key}`);
        return Result.ok();
    }
}

const createCache = (store: InMemoryGlobalKeyValueStore, tenant: { current: string }) => {
    const container = new Container();
    container.registerInstance(
        GlobalKeyValueStore,
        store as unknown as GlobalKeyValueStore.Interface
    );
    container.registerInstance(TenantContext, {
        getTenant: () => ({ id: tenant.current })
    } as unknown as TenantContext.Interface);
    container.register(ProjectFileCache);
    return container.resolve(ProjectFileCacheAbstraction);
};

const FILES = [{ id: "file-1", name: "secret.txt", content: "Tenant A secret", tokenCount: 4 }];

describe("ProjectFileCache", () => {
    it("returns cached files to the tenant that cached them", async () => {
        const store = new InMemoryGlobalKeyValueStore();
        const tenant = { current: "tenant-a" };
        const cache = createCache(store, tenant);

        await cache.set("project-1", 1, FILES);

        const result = await cache.get("project-1", 1);
        expect(result).toEqual({ files: FILES, hit: true });
    });

    it("does not return cached files of another tenant for the same project id", async () => {
        const store = new InMemoryGlobalKeyValueStore();
        const tenant = { current: "tenant-a" };
        const cache = createCache(store, tenant);

        await cache.set("project-1", 1, FILES);

        tenant.current = "tenant-b";
        const result = await cache.get("project-1", 1);
        expect(result).toEqual({ files: [], hit: false });
    });

    it("stores entries in the tenant scope, not the global one", async () => {
        const store = new InMemoryGlobalKeyValueStore();
        const cache = createCache(store, { current: "tenant-a" });

        await cache.set("project-1", 1, FILES);

        const keys = [...store.values.keys()];
        expect(keys).toHaveLength(1);
        expect(keys[0].startsWith("tenant-a:")).toBe(true);
    });
});
