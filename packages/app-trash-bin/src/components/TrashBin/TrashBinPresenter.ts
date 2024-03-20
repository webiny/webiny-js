import { makeAutoObservable } from "mobx";
import {
    ILoadingRepository,
    IMetaRepository,
    ISortRepository,
    ITrashBinEntryMapper,
    ITrashBinPresenter,
    ITrashBinRepository,
    MetaMapper,
    SortMapper,
    TrashBinEntry
} from "@webiny/app-trash-bin-common";
import { TrashBinEntryMapper } from "~/domain";

export class TrashBinPresenter implements ITrashBinPresenter {
    private itemsRepository: ITrashBinRepository;
    private loadingRepository: ILoadingRepository;
    private metaRepository: IMetaRepository;
    private sortingRepository: ISortRepository;
    private entryMapper: ITrashBinEntryMapper<TrashBinEntry>;

    constructor(
        itemsRepository: ITrashBinRepository,
        loadingRepository: ILoadingRepository,
        metaRepository: IMetaRepository,
        sortingRepository: ISortRepository
    ) {
        this.itemsRepository = itemsRepository;
        this.loadingRepository = loadingRepository;
        this.metaRepository = metaRepository;
        this.sortingRepository = sortingRepository;
        this.entryMapper = new TrashBinEntryMapper();
        makeAutoObservable(this);
    }

    async init() {
        await this.itemsRepository.init();
    }

    get vm() {
        return {
            entries: this.mapEntriesToDTOs(this.itemsRepository.getEntries()),
            selectedEntries: this.mapEntriesToDTOs(this.itemsRepository.getSelectedEntries()),
            meta: MetaMapper.toDto(this.metaRepository.get()),
            sorting: this.sortingRepository.get().map(sort => SortMapper.fromDTOtoColumn(sort)),
            loading: this.loadingRepository.get()
        };
    }

    private mapEntriesToDTOs(entries: TrashBinEntry[]) {
        return entries.map(entry => this.entryMapper.toDTO(entry));
    }
}
