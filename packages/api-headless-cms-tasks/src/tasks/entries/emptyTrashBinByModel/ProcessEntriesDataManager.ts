import { CmsEntry } from "@webiny/api-headless-cms/types";

export class ProcessEntriesDataManager {
    private readonly entries: Map<string, CmsEntry>;
    private readonly done: Map<string, CmsEntry>;
    private readonly failed: Map<string, CmsEntry>;

    public constructor() {
        this.done = new Map();
        this.failed = new Map();
        this.entries = new Map();
    }

    public addEntries(entries: CmsEntry[]) {
        entries.forEach(entry => {
            this.entries.set(entry.entryId, entry);
        });
    }

    public addDone(entry: CmsEntry): void {
        this.entries.delete(entry.entryId);
        this.failed.delete(entry.entryId);
        this.done.set(entry.entryId, entry);
    }

    public addFailed(entry: CmsEntry): void {
        this.entries.delete(entry.entryId);
        this.failed.set(entry.entryId, entry);
        this.done.delete(entry.entryId);
    }

    public getEntries() {
        return Array.from(this.entries.values());
    }

    public getFailed() {
        return Array.from(this.failed.values());
    }

    public getDone() {
        return Array.from(this.done.values());
    }
}
