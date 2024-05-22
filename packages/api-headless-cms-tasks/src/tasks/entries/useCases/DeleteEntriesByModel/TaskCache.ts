interface TaskCacheItem {
    modelId: string;
    entryIds: string[];
}

export class TaskCache {
    private taskCache: TaskCacheItem[] = [];

    cacheTask(modelId: string, entryIds: string[]): void {
        this.taskCache.push({ modelId, entryIds });
    }

    getTasks(): TaskCacheItem[] {
        return this.taskCache;
    }

    clear(): void {
        this.taskCache = [];
    }
}
