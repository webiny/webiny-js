export class Result {
    private readonly done: Set<string>;
    private readonly failed: Set<string>;

    public constructor() {
        this.done = new Set();
        this.failed = new Set();
    }

    public addDone(entryId: string): void {
        this.failed.delete(entryId);
        this.done.add(entryId);
    }

    public addFailed(entryId: string): void {
        this.failed.add(entryId);
        this.done.delete(entryId);
    }

    public getFailed() {
        return Array.from(this.failed);
    }

    public getDone() {
        return Array.from(this.done);
    }
}
