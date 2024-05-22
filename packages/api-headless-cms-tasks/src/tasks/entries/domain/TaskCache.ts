export class TaskCache<TItem> {
    private taskCache: TItem[] = [];

    cacheTask(item: TItem) {
        this.taskCache.push(item);
    }

    getTasks() {
        return this.taskCache;
    }

    clear() {
        this.taskCache = [];
    }
}
