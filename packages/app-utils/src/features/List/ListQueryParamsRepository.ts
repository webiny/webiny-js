import { makeAutoObservable, runInAction, toJS } from "mobx";
import {
    ListQueryParamsRepository as Abstraction,
    type BaseListParams,
    type IListQueryParamsRepository
} from "./abstractions.js";

export class ListQueryParamsRepositoryImpl<TParams extends BaseListParams>
    implements IListQueryParamsRepository<TParams>
{
    private params: TParams;
    private readonly initial: TParams;
    private readonly listeners = new Set<(next: TParams) => void>();

    constructor() {
        this.initial = { search: "", sort: [], filters: {}, limit: 50 } as unknown as TParams;
        this.params = this.clone(this.initial) as unknown as TParams;

        makeAutoObservable(
            this,
            {
                subscribe: false,
                dispose: false
            },
            { autoBind: true }
        );
    }

    get(): TParams {
        return this.clone(this.params);
    }

    async set(updater: (params: TParams) => void): Promise<void> {
        runInAction(() => {
            updater(this.params);
        });
        this.notify();
    }

    async replace(next: TParams): Promise<void> {
        runInAction(() => {
            this.params = this.clone(next);
        });
        this.notify();
    }

    reset(): void {
        runInAction(() => {
            this.params = this.clone(this.initial);
        });
        this.notify();
    }

    subscribe(listener: (next: TParams) => void): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    dispose(): void {
        this.listeners.clear();
    }

    private notify(): void {
        const snap = this.clone(this.params);
        for (const listener of this.listeners) {
            try {
                listener(snap);
            } catch (error) {
                // Swallow listener errors to prevent cascading failures
                console.error("Error in ListQueryParams listener:", error);
            }
        }
    }

    private clone(value: TParams): TParams {
        return structuredClone(toJS(value));
    }
}

export const ListQueryParamsRepository = Abstraction.createImplementation({
    implementation: ListQueryParamsRepositoryImpl,
    dependencies: []
});
