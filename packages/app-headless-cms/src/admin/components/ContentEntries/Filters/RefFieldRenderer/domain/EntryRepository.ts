import { makeAutoObservable, runInAction } from "mobx";
import { EntryDTO, EntryReference } from "./Entry";
import { EntriesGatewayInterface } from "../adapters";
import { EntryMapper } from "./EntryMapper";
import { Loading } from "./Loading";

export class EntryRepository {
    public readonly modelIds: string[];
    private gateway: EntriesGatewayInterface;
    private loading: Loading;
    private entries: EntryDTO[] = [];

    constructor(gateway: EntriesGatewayInterface, modelIds: string[]) {
        this.modelIds = modelIds;
        this.gateway = gateway;
        this.loading = new Loading();
        makeAutoObservable(this);
    }

    getEntries() {
        return this.entries;
    }

    getLoading() {
        return {
            isLoading: this.loading.isLoading
        };
    }

    async listEntries(query: string) {
        const response = await this.runWithLoading<EntryReference[]>(
            this.gateway.list(this.modelIds, query)
        );

        if (!response) {
            return;
        }

        runInAction(() => {
            this.entries = response.map(entry => EntryMapper.fromStorage(entry));
        });
    }

    async getEntryById(modelId: string, id: string) {
        const entryInCache = this.entries.find(entry => entry.id === id);

        if (entryInCache) {
            return entryInCache;
        }

        const response = await this.runWithLoading<EntryReference>(this.gateway.get(modelId, id));

        if (!response) {
            return;
        }

        const entryDTO = EntryMapper.fromStorage(response);
        runInAction(() => {
            this.entries = [entryDTO, ...this.entries];
        });

        return entryDTO;
    }

    private async runWithLoading<T>(action: Promise<T>) {
        return await this.loading.runCallbackWithLoading(action);
    }
}
