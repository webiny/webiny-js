import React from "react";
import chunk from "lodash/chunk.js";
import { makeAutoObservable } from "mobx";

export interface CallbackParams<T> {
    item: T;
    allItems: T[];
    report: Report;
}

export interface Result {
    title: string;
    status: "success" | "failure";
    message?: string | React.ReactElement;
}

export interface IWorkerActions<T = any> {
    process(callback: (items: T[]) => void): void;
    processInSeries(
        callback: (params: CallbackParams<T>) => Promise<void>,
        chunkSize?: number
    ): Promise<void>;
    readonly results: Result[];
    resetResults(): Promise<void>;
}

export class Report {
    private _results: Result[] = [];

    public success(result: Omit<Result, "status">): void {
        this.addResult({ ...result, status: "success" });
    }

    public error(result: Omit<Result, "status">): void {
        this.addResult({ ...result, status: "failure" });
    }

    get results(): Result[] {
        return this._results;
    }

    private addResult(result: Result): void {
        this._results.push(result);
    }
}

export interface WorkerOptions<T> {
    /**
     * Names an item in the report when processing it throws.
     * Without it, the item's own `title`, `name` or `id` is used.
     */
    getItemTitle?: (item: T) => string;
}

const getErrorMessage = (error: unknown): string => {
    if (error !== null && typeof error === "object") {
        const message = (error as { message?: unknown }).message;
        // An object without a message would only stringify to "[object Object]".
        return typeof message === "string" && message ? message : "Unknown error";
    }
    if (error === undefined || error === null) {
        return "Unknown error";
    }
    return String(error) || "Unknown error";
};

const readOwnTitle = (item: unknown): string | undefined => {
    if (item === null || typeof item !== "object") {
        return undefined;
    }
    const record = item as Record<string, unknown>;
    for (const key of ["title", "name", "id"]) {
        const value = record[key];
        if ((typeof value === "string" && value) || typeof value === "number") {
            return String(value);
        }
    }
    return undefined;
};

export class Worker<T> {
    private _items: T[] = [];
    private _report: Report;
    private readonly getItemTitle?: (item: T) => string;

    constructor(options: WorkerOptions<T> = {}) {
        this._report = new Report();
        this.getItemTitle = options.getItemTitle;
        makeAutoObservable<Worker<T>, "getItemTitle">(this, {
            getItemTitle: false
        });
    }

    public process(items: T[], callback: (items: T[]) => void): void {
        this._items = items;
        callback(this._items);
    }

    public async processInSeries(
        items: T[],
        callback: (params: CallbackParams<T>) => Promise<void>,
        chunkSize = 10
    ): Promise<void> {
        this._items = items;
        const chunks = chunk(this._items, chunkSize);
        // No chunk rejects: a failed item is recorded in the report, so the run
        // resolves only after every item has been tried.
        const promises = chunks.map((c, index) =>
            this.processChunk(callback, c, index * chunkSize)
        );
        await Promise.all(promises);
    }

    get results(): Result[] {
        return this._report.results;
    }

    public async resetResults(): Promise<void> {
        this._items = [];
        this._report = new Report();
    }

    private async processChunk(
        callback: (params: CallbackParams<T>) => void | Promise<void>,
        chunk: T[],
        offset: number
    ): Promise<void> {
        for (const [index, item] of chunk.entries()) {
            try {
                await callback({ item, allItems: this._items, report: this._report });
            } catch (error) {
                this._report.error({
                    title: this.getTitle(item, offset + index),
                    message: getErrorMessage(error)
                });
            }
        }
    }

    private getTitle(item: T, index: number): string {
        if (this.getItemTitle) {
            try {
                const title = this.getItemTitle(item);
                if (title) {
                    return title;
                }
            } catch {
                // Fall back to the item's own title below.
            }
        }
        return readOwnTitle(item) ?? `Item ${index + 1}`;
    }
}
