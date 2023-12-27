import cloneDeep from "lodash/cloneDeep";
import { makeAutoObservable, runInAction } from "mobx";
import { EntryDTO } from "./Entry";
import { EntriesGatewayInterface } from "../gateways";
import { Loading } from "~/components/AdvancedSearch/domain";
import { EntryMapper } from "./EntryMapper";

export class EntryRepository {
    public readonly modelId: string;
    private gateway: EntriesGatewayInterface;
    private loading: Loading;
    private entries: EntryDTO[] = [];

    constructor(gateway: EntriesGatewayInterface, modelId: string) {
        this.modelId = modelId;
        this.gateway = gateway;
        this.loading = new Loading();
        makeAutoObservable(this);
    }

    getEntries() {
        return cloneDeep(this.entries);
    }

    getLoading() {
        return {
            isLoading: this.loading.isLoading
        };
    }

    async listEntries(query: string) {
        const response = await this.runWithLoading<EntryDTO[]>(
            this.gateway.list(this.modelId, query)
        );

        if (!response) {
            return;
        }

        runInAction(() => {
            this.entries = response.map(entry => EntryMapper.toDTO(entry));
        });
    }

    async getEntryById(id: string) {
        const entryInCache = this.entries.find(entry => entry.id === id);

        if (entryInCache) {
            return entryInCache;
        }

        const response = await this.runWithLoading<EntryDTO>(this.gateway.get(this.modelId, id));

        if (!response) {
            return;
        }

        const entryDTO = EntryMapper.toDTO(response);
        runInAction(() => {
            this.entries = [entryDTO, ...this.entries];
        });

        return cloneDeep(entryDTO);
    }

    private async runWithLoading<T>(action: Promise<T>) {
        return await this.loading.runCallbackWithLoading(action);
    }
}
