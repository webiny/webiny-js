import { makeAutoObservable, runInAction } from "mobx";
import uniqBy from "lodash/uniqBy";
import {
    ITrashBinDeleteEntryGateway,
    ITrashBinEntryMapper,
    ITrashBinListGateway,
    ITrashBinRepository
} from "~/abstractions";
import { TrashBinEntry } from "./TrashBinEntry";
import { Loading } from "./Loading";
import { TrashBinListQueryVariables, TrashBinMetaResponse } from "~/types";

export class TrashBinRepository<TEntry extends Record<string, any>> implements ITrashBinRepository {
    private listGateway: ITrashBinListGateway<TEntry>;
    private deleteGateway: ITrashBinDeleteEntryGateway;
    private loading: Loading;
    private entryMapper: ITrashBinEntryMapper<TEntry>;
    private entries: TrashBinEntry[] = [];
    private selectedEntries: TrashBinEntry[] = [];
    private meta: TrashBinMetaResponse = {
        totalCount: 0,
        cursor: null,
        hasMoreItems: false
    };

    constructor(
        listGateway: ITrashBinListGateway<TEntry>,
        deleteGateway: ITrashBinDeleteEntryGateway,
        entryMapper: ITrashBinEntryMapper<TEntry>
    ) {
        this.listGateway = listGateway;
        this.deleteGateway = deleteGateway;
        this.loading = new Loading();
        this.entryMapper = entryMapper;
        makeAutoObservable(this);
    }

    async init() {
        if (this.entries.length > 0) {
            return;
        }

        const response = await this.runWithLoading(this.listGateway.execute({}));

        if (!response) {
            return;
        }

        runInAction(() => {
            const [entries, meta] = response;
            this.entries = entries.map(entry =>
                TrashBinEntry.create(this.entryMapper.toDTO(entry))
            );
            this.meta = meta;
        });
    }

    getEntries() {
        return this.entries;
    }

    getSelectedEntries() {
        return this.selectedEntries;
    }

    getLoading() {
        return this.loading.isLoading;
    }

    getMeta() {
        return this.meta;
    }

    getSort() {
        return [];
    }

    async listEntries(override: boolean, params?: TrashBinListQueryVariables) {
        const executeParams = params || ({} as TrashBinListQueryVariables);
        const response = await this.runWithLoading(this.listGateway.execute(executeParams));

        if (!response) {
            return;
        }

        runInAction(() => {
            const [entries, meta] = response;
            const entriesDTO = entries.map(entry =>
                TrashBinEntry.create(this.entryMapper.toDTO(entry))
            );
            this.entries = override ? entriesDTO : uniqBy([...this.entries, ...entriesDTO], "id");
            this.meta = meta;
        });
    }

    async selectEntries(entries: TrashBinEntry[]) {
        this.selectedEntries = entries;
    }

    async deleteEntry(id: string) {
        const response = await this.runWithLoading(this.deleteGateway.execute(id));

        if (response) {
            runInAction(() => {
                this.entries = this.entries.filter(entry => entry.id !== id);
            });
        }
    }

    private async runWithLoading<T>(action: Promise<T>) {
        return await this.loading.runCallbackWithLoading(action);
    }
}
