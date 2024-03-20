import { makeAutoObservable } from "mobx";
import { ITrashBinItemMapper, TrashBinItem } from "@webiny/app-trash-bin-common";
import {
    ILoadingRepository,
    IMetaRepository,
    ISortingRepository,
    MetaMapper,
    SortingMapper
} from "@webiny/app-utilities";
import { ITrashBinPresenter, ITrashBinRepository } from "~/components/TrashBin/abstractions";
import { TrashBinItemMapper } from "./domain";

export class TrashBinPresenter implements ITrashBinPresenter {
    private itemsRepository: ITrashBinRepository;
    private loadingRepository: ILoadingRepository;
    private metaRepository: IMetaRepository;
    private sortingRepository: ISortingRepository;
    private itemMapper: ITrashBinItemMapper<TrashBinItem>;

    constructor(
        itemsRepository: ITrashBinRepository,
        loadingRepository: ILoadingRepository,
        metaRepository: IMetaRepository,
        sortingRepository: ISortingRepository
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
            items: this.mapItemsToDTOs(this.itemsRepository.getItems()),
            selectedItems: this.mapItemsToDTOs(this.itemsRepository.getSelectedItems()),
            meta: MetaMapper.toDto(this.metaRepository.get()),
            sorting: this.sortingRepository.get().map(sort => SortingMapper.fromDTOtoColumn(sort)),
            loading: this.loadingRepository.get()
        };
    }

    private mapItemsToDTOs(items: TrashBinItem[]) {
        return items.map(item => this.itemMapper.toDTO(item));
    }
}
