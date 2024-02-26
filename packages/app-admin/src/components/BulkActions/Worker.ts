import chunk from "lodash/chunk";
import { makeAutoObservable } from "mobx";

export interface CallbackParams<T> {
    item: T;
    allItems: T[];
    report: Report;
}

export interface Result {
    title: string;
    status: "success" | "failure";
    message?: string;
}

/**
 * Class for collecting processing results
 */
export class Report {
    private _results: Result[] = [];

    /**
     * Record a successful result in the report
     * @param {Omit<Result, "status">} result - The successful result to be recorded
     */
    public success(result: Omit<Result, "status">): void {
        this.addResult({
            ...result,
            status: "success"
        });
    }

    /**
     * Record an error result in the report.
     * @param {Omit<Result, "status">} result - The error result to be recorded.
     */
    public error(result: Omit<Result, "status">): void {
        this.addResult({
            ...result,
            status: "failure"
        });
    }

    /**
     * Get the array of recorded results.
     * @returns {Result[]} - An array of recorded results.
     */
    get results(): Result[] {
        return this._results;
    }

    /**
     * Internal method to add a result to the report.
     * @private
     * @param {Result} result - The result to be added to the report.
     */
    private addResult(result: Result): void {
        this._results.push(result);
    }
}

/**
 * A generic worker class for processing items.
 * @template T - The type of items being processed.
 */
export class Worker<T> {
    private _items: T[];
    private _report: Report;

    constructor() {
        this._items = [];
        this._report = new Report();
        makeAutoObservable(this);
    }

    /**
     * Process the items using the provided callback function.
     * @param callback - The callback function to process the items.
     */
    public process(callback: (items: T[]) => void): void {
        callback(this._items);
    }

    /**
     * Process the items in series with the given chunk size.
     * @param callback - The callback function to process each item.
     * @param {number} [chunkSize=10] - The size of each chunk for processing in series.
     * @returns {Promise<void>}
     */
    public async processInSeries(
        callback: ({ item, allItems, report }: CallbackParams<T>) => Promise<void>,
        chunkSize = 10
    ): Promise<void> {
        const chunks = chunk(this._items, chunkSize);
        const promises = chunks.map(chunk => this.processChunk(callback, chunk));
        await Promise.all(promises);
    }

    /**
     * Get the array of results collected by the worker.
     * @returns {Result[]} - An array of collected results.
     */
    get results(): Result[] {
        return this._report.results;
    }

    /**
     * Get the current items in the worker.
     * @returns {T[]} - An array of items in the worker.
     */
    get items(): T[] {
        return this._items;
    }

    /**
     * Set the items in the worker.
     * @param {T[]} items - The items to be set in the worker.
     */
    set items(items: T[]) {
        this._items = items;
    }

    /**
     * Internal method to process a chunk of items using the provided callback.
     * @private
     * @param callback - The callback function to process each item.
     * @param {T[]} chunk - The chunk of items to be processed.
     * @returns {Promise<void>}
     */
    private async processChunk(
        callback: ({ item, allItems, report }: CallbackParams<T>) => void | Promise<void>,
        chunk: T[]
    ): Promise<void> {
        for (const item of chunk) {
            await callback({ item, allItems: this._items, report: this._report });
        }
    }
}
