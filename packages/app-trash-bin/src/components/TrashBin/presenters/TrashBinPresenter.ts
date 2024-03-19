import { makeAutoObservable } from "mobx";
import {
    ITrashBinEntryMapper,
    ITrashBinPresenter,
    ITrashBinRepository,
    TrashBinEntry
} from "@webiny/app-trash-bin-common";
import { TrashBinEntryMapper } from "~/domain";

export class TrashBinPresenter implements ITrashBinPresenter {
    private repository: ITrashBinRepository;
    private entryMapper: ITrashBinEntryMapper<TrashBinEntry>;

    constructor(repository: ITrashBinRepository) {
        this.repository = repository;
        this.entryMapper = new TrashBinEntryMapper();
        makeAutoObservable(this);
    }

    async init() {
        await this.repository.init();
    }

    get vm() {
        return {
            entries: this.mapEntriesToDTOs(this.repository.getEntries()),
            selectedEntries: this.mapEntriesToDTOs(this.repository.getSelectedEntries()),
            meta: this.repository.getMeta(),
            sorting: [],
            loading: {}
        };
    }

    private mapEntriesToDTOs(entries: TrashBinEntry[]) {
        return entries.map(entry => this.entryMapper.toDTO(entry));
    }
}
