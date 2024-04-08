import { IDeleteTrashBinEntriesInput } from "~/types";

export class DeleteEntriesDataManager {
    private readonly input: IDeleteTrashBinEntriesInput;
    private readonly entryIds: Set<string>;
    private readonly done: Set<string>;
    private readonly failed: Set<string>;

    public constructor(input: IDeleteTrashBinEntriesInput) {
        this.input = input;
        this.entryIds = new Set(input.entryIds);
        this.done = new Set(input.done || []);
        this.failed = new Set(input.failed || []);
    }

    public addDone(entryId: string): void {
        this.entryIds.delete(entryId);
        this.failed.delete(entryId);
        this.done.add(entryId);
    }

    public addFailed(entryId: string): void {
        this.entryIds.delete(entryId);
        this.failed.add(entryId);
        this.done.delete(entryId);
    }

    public getFailed() {
        return Array.from(this.failed);
    }

    public getDone() {
        return Array.from(this.done);
    }

    public getInput(): IDeleteTrashBinEntriesInput {
        return {
            ...this.input,
            entryIds: Array.from(this.entryIds),
            failed: Array.from(this.failed),
            done: Array.from(this.done)
        };
    }
}
