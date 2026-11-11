import { compress, decompress } from "@webiny/utils/features/compression/legacy/gzip.js";
import { GlobalKeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { ProjectFileCache as Abstraction, ProjectFileContent } from "./abstractions.js";

const CACHE_TTL_DAYS = 30;

interface CachedProjectContext {
    files: ProjectFileContent[];
}

class ProjectFileCacheImpl implements Abstraction.Interface {
    constructor(
        private tenantContext: TenantContext.Interface,
        private keyValueStore: GlobalKeyValueStore.Interface
    ) {}

    async get(
        projectId: string,
        version: number
    ): Promise<{ files: ProjectFileContent[]; hit: boolean }> {
        const key = this.cacheKey(projectId, version);
        const cached = await this.keyValueStore.get<string>(key, { scope: this.scope() });

        if (!cached.isFail() && cached.value) {
            try {
                const decompressed = await decompress(Buffer.from(cached.value, "base64"));
                const parsed = JSON.parse(decompressed.toString("utf-8")) as CachedProjectContext;
                return { files: parsed.files, hit: true };
            } catch (error) {
                console.warn("ProjectFileCache: cache entry corrupted, rebuilding", {
                    key,
                    error
                });
            }
        }

        return { files: [], hit: false };
    }

    async set(projectId: string, version: number, files: ProjectFileContent[]): Promise<void> {
        const key = this.cacheKey(projectId, version);

        try {
            const payload: CachedProjectContext = { files };
            const compressed = await compress(JSON.stringify(payload));
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + CACHE_TTL_DAYS);
            await this.keyValueStore.set(key, compressed.toString("base64"), {
                scope: this.scope(),
                expiresAt
            });
        } catch (error) {
            console.warn("ProjectFileCache: cache write failed", { key, error });
        }
    }

    /**
     * `projectId` comes from the client, so the cache is scoped to the current tenant (the same
     * scope the tenant `KeyValueStore` uses), to never serve file contents of another tenant.
     */
    private scope(): string {
        return this.tenantContext.getTenant().id;
    }

    private cacheKey(projectId: string, version: number): string {
        return `AiProjectContext/${projectId}/v${version}`;
    }
}

export const ProjectFileCache = Abstraction.createImplementation({
    implementation: ProjectFileCacheImpl,
    dependencies: [TenantContext, GlobalKeyValueStore]
});
