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

export class Worker<T> {
    private _items: T[] = [];
    private _report: Report;

    constructor() {
        this._report = new Report();
        makeAutoObservable(this);
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
        const promises = chunks.map(c => this.processChunk(callback, c));
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
        chunk: T[]
    ): Promise<void> {
        for (const item of chunk) {
            await callback({ item, allItems: this._items, report: this._report });
        }
    }
}
