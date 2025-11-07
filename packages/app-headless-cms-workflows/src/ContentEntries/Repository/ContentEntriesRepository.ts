import { makeAutoObservable, observable, runInAction } from "mobx";
import { type ICmsEntryRevisionSimple, IGenericError } from "../types.js";
import type { IContentEntriesRepository } from "./abstractions/ContentEntriesRepository.js";
import type { IContentEntriesGateway } from "../Gateway/index.js";

interface IContentEntriesRepositoryParams {
    gateway: IContentEntriesGateway;
}

export class ContentEntriesRepository implements IContentEntriesRepository {
    public readonly items;
    private _error: IGenericError | null = null;
    private _loading: boolean = false;
    #gateway;

    public get error(): IGenericError | null {
        return this._error;
    }

    public get loading(): boolean {
        return this._loading;
    }

    public constructor(params: IContentEntriesRepositoryParams) {
        this.#gateway = params.gateway;

        this.items = observable.array<ICmsEntryRevisionSimple>([]);

        makeAutoObservable(this);
    }

    public async list(revisions: string[]): Promise<void> {
        runInAction(() => {
            this._loading = false;
            this._error = null;
        });

        const result = await this.#gateway.list(revisions);

        runInAction(() => {
            this._loading = false;
            this._error = result.error;
            this.items.push(...result.data);
        });
    }
}
