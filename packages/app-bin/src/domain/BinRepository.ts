import { makeAutoObservable, runInAction } from "mobx";
import {
    IBinDeleteEntryGateway,
    IBinEntryMapper,
    IBinListGateway,
    IBinRepository
} from "../abstractions";
import { BinEntry } from "./BinEntry";
import { Loading } from "./Loading";
import { BinListQueryVariables, BinMetaResponse } from "~/types";

export class BinRepository<
    TListParams extends BinListQueryVariables,
    TEntry extends Record<string, any>
> implements IBinRepository<TListParams>
{
    private listGateway: IBinListGateway<TListParams, TEntry>;
    private deleteGateway: IBinDeleteEntryGateway;
    private loading: Loading;
    private entryMapper: IBinEntryMapper<TEntry>;
    private entries: BinEntry[] = [];
    private meta: BinMetaResponse = {
        totalCount: 0,
        cursor: null,
        hasMoreItems: false
    };

    constructor(
        listGateway: IBinListGateway<TListParams, TEntry>,
        deleteGateway: IBinDeleteEntryGateway,
        entryMapper: IBinEntryMapper<TEntry>
    ) {
        this.listGateway = listGateway;
        this.deleteGateway = deleteGateway;
        this.loading = new Loading();
        this.entryMapper = entryMapper;
        makeAutoObservable(this);
    }

    getEntries() {
        return this.entries;
    }

    getLoading() {
        return this.loading.isLoading;
    }

    getMeta() {
        return this.meta;
    }

    async listEntries(params?: TListParams) {
        const executeParams = params || ({} as TListParams);
        const response = await this.runWithLoading(this.listGateway.execute(executeParams));

        if (!response) {
            return;
        }

        runInAction(() => {
            const [entries, meta] = response;
            this.entries = entries.map(entry => BinEntry.create(this.entryMapper.toDTO(entry)));
            this.meta = meta;
        });
    }

    async deleteEntry(id: string) {
        const response = await this.runWithLoading(this.deleteGateway.execute(id));

        if (response) {
            runInAction(() => {
                this.entries.filter(entry => entry.id !== id);
            });
        }
    }

    private async runWithLoading<T>(action: Promise<T>) {
        return await this.loading.runCallbackWithLoading(action);
    }
}
