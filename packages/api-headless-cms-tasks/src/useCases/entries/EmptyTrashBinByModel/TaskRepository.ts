export class TaskRepository {
    private readonly done: Set<string>;
    private readonly failed: Set<string>;

    public constructor() {
        this.done = new Set();
        this.failed = new Set();
    }

    public addDone(entryIds: string[]): void {
        entryIds.forEach(entryId => {
            this.done.add(entryId);
        });
    }

    public addFailed(entryIds: string[]): void {
        entryIds.forEach(entryId => {
            this.failed.add(entryId);
        });
    }

    public getFailed() {
        return Array.from(this.failed);
    }

    public getDone() {
        return Array.from(this.done);
    }
}
