import { makeAutoObservable } from "mobx";
import {
    ILoadingRepository,
    IMetaRepository,
    ISortRepository,
    ITrashBinItemMapper,
    ITrashBinPresenter,
    ITrashBinRepository,
    MetaMapper,
    SortMapper,
    TrashBinItem
} from "@webiny/app-trash-bin-common";
import { TrashBinItemMapper } from "~/domain";

export class TrashBinPresenter implements ITrashBinPresenter {
    private itemsRepository: ITrashBinRepository;
    private loadingRepository: ILoadingRepository;
    private metaRepository: IMetaRepository;
    private sortingRepository: ISortRepository;
    private itemMapper: ITrashBinItemMapper<TrashBinItem>;

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
        this.itemMapper = new TrashBinItemMapper();
        makeAutoObservable(this);
    }

    async init() {
        await this.itemsRepository.init();
    }

    get vm() {
        return {
            entries: this.mapItemsToDTOs(this.itemsRepository.getItems()),
            selectedEntries: this.mapItemsToDTOs(this.itemsRepository.getSelectedItems()),
            meta: MetaMapper.toDto(this.metaRepository.get()),
            sorting: this.sortingRepository.get().map(sort => SortMapper.fromDTOtoColumn(sort)),
            loading: this.loadingRepository.get()
        };
    }

    private mapItemsToDTOs(items: TrashBinItem[]) {
        return items.map(item => this.itemMapper.toDTO(item));
    }
}
