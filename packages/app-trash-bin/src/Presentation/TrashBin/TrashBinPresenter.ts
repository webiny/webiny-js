import { makeAutoObservable } from "mobx";
import { ITrashBinItemMapper, TrashBinItem } from "@webiny/app-trash-bin-common";
import { ISortingRepository, MetaMapper, SortingMapper } from "@webiny/app-utils";
import {
    TrashBinItemMapper,
    ITrashBinItemsRepository,
    ISelectedItemsRepository,
    ISearchRepository
} from "~/Domain/Repositories";
import { LoadingActions } from "~/types";

export class TrashBinPresenter {
    private itemsRepository: ITrashBinItemsRepository;
    private selectedRepository: ISelectedItemsRepository;
    private sortingRepository: ISortingRepository;
    private searchRepository: ISearchRepository;
    private itemMapper: ITrashBinItemMapper<TrashBinItem>;

    constructor(
        itemsRepository: ITrashBinItemsRepository,
        selectedRepository: ISelectedItemsRepository,
        sortingRepository: ISortingRepository,
        searchRepository: ISearchRepository
    ) {
        this.itemsRepository = itemsRepository;
        this.selectedRepository = selectedRepository;
        this.sortingRepository = sortingRepository;
        this.searchRepository = searchRepository;
        this.itemMapper = new TrashBinItemMapper();
        makeAutoObservable(this);
    }

    get vm() {
        return {
            items: this.mapItemsToDTOs(this.itemsRepository.getItems()),
            selectedItems: this.mapItemsToDTOs(this.selectedRepository.getSelectedItems()),
            meta: MetaMapper.toDto(this.itemsRepository.getMeta()),
            sorting: this.sortingRepository.get().map(sort => SortingMapper.fromDTOtoColumn(sort)),
            loading: this.itemsRepository.getLoading(),
            isEmptyView: this.getIsEmptyView(),
            searchQuery: this.searchRepository.get(),
            searchLabel: "Search all items"
        };
    }

    private mapItemsToDTOs(items: TrashBinItem[]) {
        return items.map(item => this.itemMapper.toDTO(item));
    }

    private getIsEmptyView() {
        const loading = this.itemsRepository.getLoading();
        const items = this.itemsRepository.getItems();
        return !loading[LoadingActions.list] && !items.length;
    }
}
