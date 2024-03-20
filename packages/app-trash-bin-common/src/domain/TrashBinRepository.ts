import { makeAutoObservable, runInAction } from "mobx";
import uniqBy from "lodash/uniqBy";
import {
    ITrashBinDeleteEntryGateway,
    ITrashBinEntryMapper,
    ITrashBinListGateway,
    ITrashBinRepository
} from "~/abstractions";
import { TrashBinEntry } from "./TrashBinEntry";
import { TrashBinListQueryVariables } from "~/types";

export class TrashBinRepository<TEntry extends Record<string, any>> implements ITrashBinRepository {
    private listGateway: ITrashBinListGateway<TEntry>;
    private deleteGateway: ITrashBinDeleteEntryGateway;
    private entryMapper: ITrashBinEntryMapper<TEntry>;
    private entries: TrashBinEntry[] = [];
    private selectedEntries: TrashBinEntry[] = [];

    constructor(
        listGateway: ITrashBinListGateway<TEntry>,
        deleteGateway: ITrashBinDeleteEntryGateway,
        entryMapper: ITrashBinEntryMapper<TEntry>
    ) {
        this.listGateway = listGateway;
        this.deleteGateway = deleteGateway;
        this.entryMapper = entryMapper;
        makeAutoObservable(this);
    }

    async init(params = {}) {
        if (this.entries.length > 0) {
            return;
        }

        const response = await this.listGateway.execute(params);

        if (!response) {
            return;
        }

        runInAction(() => {
            const [entries] = response;
            this.entries = entries.map(entry =>
                TrashBinEntry.create(this.entryMapper.toDTO(entry))
            );
        });
    }

    getEntries() {
        return this.entries;
    }

    getSelectedEntries() {
        return this.selectedEntries;
    }

    async listEntries(override: boolean, params?: TrashBinListQueryVariables) {
        const executeParams = params || ({} as TrashBinListQueryVariables);
        const response = await this.listGateway.execute(executeParams);

        if (!response) {
            return;
        }

        runInAction(() => {
            const [entries] = response;
            const entriesDTO = entries.map(entry =>
                TrashBinEntry.create(this.entryMapper.toDTO(entry))
            );
            this.entries = override ? entriesDTO : uniqBy([...this.entries, ...entriesDTO], "id");
        });
    }

    async selectEntries(entries: TrashBinEntry[]) {
        this.selectedEntries = entries;
    }

    async deleteEntry(id: string) {
        const response = await this.deleteGateway.execute(id);

        if (response) {
            runInAction(() => {
                this.entries = this.entries.filter(entry => entry.id !== id);
            });
        }
    }
}
