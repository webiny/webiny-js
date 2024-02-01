import { IExportPagesZipPagesDone, IExportPagesZipPagesInput } from "~/export/pages/types";

export class ZipPagesDataManager {
    private readonly input: IExportPagesZipPagesInput;
    private readonly queue: Set<string>;
    private readonly done: IExportPagesZipPagesDone;
    private readonly failed: Set<string>;

    public constructor(input: IExportPagesZipPagesInput) {
        this.input = input;
        this.queue = new Set(input.queue);
        this.done = {
            ...input.done
        };
        this.failed = new Set(input.failed || []);
    }

    public hasMore(): boolean {
        return this.queue.size > 0;
    }

    public addDone(pageId: string, key: string): void {
        this.queue.delete(pageId);
        this.failed.delete(pageId);
        this.done[pageId] = key;
    }

    public addFailed(pageId: string): void {
        this.queue.delete(pageId);
        this.failed.add(pageId);
        delete this.done[pageId];
    }

    public getFailed() {
        return Array.from(this.failed);
    }

    public getDone() {
        return this.done;
    }

    public getInput(): IExportPagesZipPagesInput {
        return {
            ...this.input,
            queue: Array.from(this.queue),
            failed: Array.from(this.failed),
            done: this.done
        };
    }
}
