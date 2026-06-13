import { makeAutoObservable, runInAction } from "mobx";
import { Worker, type Report, type Result } from "./Worker.js";

export type { Report };

export interface BulkActionViewModel {
    processing: boolean;
    results: Result[];
}

interface BulkActionHandlers<T> {
    onItem: (item: T, report: Report) => Promise<void>;
    onBulk?: (items: T[]) => Promise<void>;
}

/**
 * Reusable runner for bulk action presenters.
 *
 * Owns the Worker, processing state, and result tracking. The presenter
 * composes a runner instance and delegates to it, providing only the
 * action-specific callbacks (onItem for series, onBulk for server-side batch).
 *
 * Usage:
 * ```ts
 * class BulkPublishPresenterImpl {
 *     private runner = new BulkActionRunner<MyItem>();
 *
 *     get vm() { return this.runner.vm; }
 *
 *     async execute(items, allSelected) {
 *         await this.runner.run(items, allSelected, {
 *             onItem: (item, report) => { ... },
 *             onBulk: (items) => { ... }
 *         });
 *     }
 *
 * }
 * ```
 */
export class BulkActionRunner<T> {
    private worker = new Worker<T>();
    private _processing = false;

    constructor() {
        makeAutoObservable<BulkActionRunner<T>, "worker">(this, {
            worker: false
        });
    }

    get vm(): BulkActionViewModel {
        return {
            processing: this._processing,
            results: this.worker.results
        };
    }

    async run(items: T[], allSelected: boolean, handlers: BulkActionHandlers<T>): Promise<void> {
        this._processing = true;
        await this.worker.resetResults();

        try {
            if (allSelected && handlers.onBulk) {
                await handlers.onBulk(items);
            } else {
                await this.worker.processInSeries(items, ({ item, report }) =>
                    handlers.onItem(item, report)
                );
            }
        } finally {
            runInAction(() => {
                this._processing = false;
            });
        }
    }
}
