import chunk from "lodash/chunk";

export interface CallbackParams<T> {
    item: T;
    allItems: T[];
    report: Report;
}

export interface Result {
    message: string;
    status: "success" | "failure";
}

export class Report {
    private _results: Result[] = [];

    public success(result: Pick<Result, "message">): void {
        this.addResult({
            ...result,
            status: "success"
        });
    }

    public error(result: Pick<Result, "message">): void {
        this.addResult({
            ...result,
            status: "failure"
        });
    }

    get results(): Result[] {
        return this._results;
    }

    private addResult(result: Result): void {
        this._results.push(result);
    }
}

export class Worker<T> {
    private _items: T[];
    private report: Report;

    constructor(items: T[]) {
        this._items = items;
        this.report = new Report();
    }

    private processChunk = async (
        callback: ({ item, allItems, report }: CallbackParams<T>) => void | Promise<void>,
        chunk: T[]
    ): Promise<void> => {
        for (const item of chunk) {
            await callback({ item, allItems: this.items, report: this.report });
        }
    };

    public process = (callback: (items: T[]) => void): void => {
        callback(this.items);
    };

    public processInSeries = async (
        callback: ({ item, allItems, report }: CallbackParams<T>) => Promise<void>,
        chunkSize = 10
    ): Promise<void> => {
        const chunks = chunk(this.items, chunkSize);
        const promises = chunks.map(chunk => this.processChunk(callback, chunk));
        await Promise.all(promises);
    };

    get results(): Result[] {
        return this.report.results;
    }

    get items(): T[] {
        return this._items;
    }
}
