import { SecurityIdentity } from "@webiny/api-security/types";

interface TaskCacheItem {
    modelId: string;
    ids: string[];
    identity: SecurityIdentity;
}

export class TaskCache {
    private taskCache: TaskCacheItem[] = [];

    cacheTask(modelId: string, ids: string[], identity: SecurityIdentity): void {
        this.taskCache.push({ modelId, ids, identity });
    }

    getTasks(): TaskCacheItem[] {
        return this.taskCache;
    }

    clear(): void {
        this.taskCache = [];
    }
}
