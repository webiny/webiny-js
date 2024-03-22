import { makeAutoObservable } from "mobx";
import { ITrashBinItemMapper, TrashBinItem } from "@webiny/app-trash-bin-common";
import {
    ILoadingRepository,
    IMetaRepository,
    ISortingRepository,
    MetaMapper,
    SortingMapper
} from "@webiny/app-utils";
import {
    ITrashBinPresenter,
    ITrashBinItemsRepository,
    ISelectedItemsRepository,
    ISearchRepository
} from "~/components/TrashBin/abstractions";
import { TrashBinItemMapper } from "./domain";
import { LoadingEnum } from "~/types";

export class TrashBinPresenter implements ITrashBinPresenter {
    private itemsRepository: ITrashBinItemsRepository;
    private selectedRepository: ISelectedItemsRepository;
    private loadingRepository: ILoadingRepository;
    private metaRepository: IMetaRepository;
    private sortingRepository: ISortingRepository;
    private searchRepository: ISearchRepository;
    private itemMapper: ITrashBinItemMapper<TrashBinItem>;

    constructor(
        itemsRepository: ITrashBinItemsRepository,
        selectedRepository: ISelectedItemsRepository,
        loadingRepository: ILoadingRepository,
        metaRepository: IMetaRepository,
        sortingRepository: ISortingRepository,
        searchRepository: ISearchRepository
    ) {
        this.itemsRepository = itemsRepository;
        this.selectedRepository = selectedRepository;
        this.loadingRepository = loadingRepository;
        this.metaRepository = metaRepository;
        this.sortingRepository = sortingRepository;
        this.searchRepository = searchRepository;
        this.itemMapper = new TrashBinItemMapper();
        makeAutoObservable(this);
    }

    async init() {
        await this.itemsRepository.init();
    }

    get vm() {
        return {
            items: this.mapItemsToDTOs(this.itemsRepository.getItems()),
            selectedItems: this.mapItemsToDTOs(this.selectedRepository.getSelectedItems()),
            meta: MetaMapper.toDto(this.metaRepository.get()),
            sorting: this.sortingRepository.get().map(sort => SortingMapper.fromDTOtoColumn(sort)),
            loading: this.loadingRepository.get(),
            isEmptyView: this.getIsEmptyView(),
            searchQuery: this.searchRepository.get(),
            searchLabel: "Search all items"
        };
    }

    private mapItemsToDTOs(items: TrashBinItem[]) {
        return items.map(item => this.itemMapper.toDTO(item));
    }

    private getIsEmptyView() {
        const loading = this.loadingRepository.get();
        const items = this.itemsRepository.getItems();
        return !loading[LoadingEnum.init] && !loading[LoadingEnum.list] && !items.length;
    }
}
