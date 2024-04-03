import { IDeleteEntriesProcessEntriesInput } from "~/types";
import { CmsEntry } from "@webiny/api-headless-cms/types";

export class ProcessEntriesDataManager {
    private readonly input: IDeleteEntriesProcessEntriesInput;
    private readonly entries: Map<string, CmsEntry>;
    private readonly done: Map<string, CmsEntry>;
    private readonly failed: Map<string, CmsEntry>;

    public constructor(input: IDeleteEntriesProcessEntriesInput) {
        this.input = input;

        this.done = new Map();
        if (this.input.done) {
            this.input.done.forEach(entry => {
                this.done.set(entry.entryId, entry);
            });
        }

        this.failed = new Map();
        if (this.input.failed) {
            this.input.failed.forEach(entry => {
                this.failed.set(entry.entryId, entry);
            });
        }

        this.entries = new Map();
        this.input.entries.forEach(entry => {
            this.entries.set(entry.entryId, entry);
        });
    }

    public hasMore(): boolean {
        return this.entries.size > 0;
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

    public getInput(): IDeleteEntriesProcessEntriesInput {
        return {
            ...this.input,
            entries: this.getEntries(),
            failed: this.getFailed(),
            done: this.getDone()
        };
    }
}
