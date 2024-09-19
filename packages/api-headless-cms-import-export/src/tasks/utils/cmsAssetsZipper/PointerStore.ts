import type { CmsEntryMeta } from "@webiny/api-headless-cms/types";

export interface IPointerStoreParams {
    entryMeta: {
        cursor: string | null | undefined;
    };
    fileCursor?: string;
}

export class PointerStore {
    private isTaskAborted = false;
    private isStoredFiles = false;
    private entryMeta?: CmsEntryMeta;
    private fileCursor?: string;

    public constructor(params: IPointerStoreParams) {
        this.entryMeta = {
            cursor: params.entryMeta.cursor || null,
            hasMoreItems: true,
            totalCount: 0
        };
        this.fileCursor = params.fileCursor;
    }

    public setEntryMeta(meta?: CmsEntryMeta): void {
        this.entryMeta = meta;
    }

    public getEntryTotalItems(): number {
        return this.entryMeta?.totalCount || 0;
    }

    public getEntryHasMoreItems(): boolean {
        return !!this.entryMeta?.hasMoreItems;
    }

    public getEntryCursor(): string | undefined {
        if (!this.entryMeta?.cursor || !this.entryMeta.hasMoreItems) {
            return undefined;
        }
        return this.entryMeta.cursor;
    }

    public setFileCursor(cursor?: string): void {
        this.fileCursor = cursor;
    }

    public getFileCursor(): string | undefined {
        return this.fileCursor;
    }

    public getIsStoredFiles(): boolean {
        return this.isStoredFiles;
    }

    public setIsStoredFiles(): void {
        if (this.isStoredFiles) {
            throw new Error(`The "setIsStoredFiles" method should be called only once.`);
        }
        this.isStoredFiles = true;
    }

    public getTaskIsAborted(): boolean {
        return this.isTaskAborted;
    }

    public setTaskIsAborted(): void {
        if (this.isTaskAborted) {
            throw new Error(`The "setTaskIsAborted" method should be called only once.`);
        }
        this.isTaskAborted = true;
    }

    public resetFileCursor(): void {
        this.fileCursor = undefined;
    }
}
