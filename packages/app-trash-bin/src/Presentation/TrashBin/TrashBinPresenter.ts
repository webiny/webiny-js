import { makeAutoObservable } from "mobx";
import { ITrashBinItemMapper, TrashBinItem } from "~/Domain";
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
    private readonly retentionPeriod: number;
    private readonly nameColumnId: string | undefined;

    constructor(
        itemsRepository: ITrashBinItemsRepository,
        selectedRepository: ISelectedItemsRepository,
        sortingRepository: ISortingRepository,
        searchRepository: ISearchRepository,
        retentionPeriod: number,
        nameColumnId?: string
    ) {
        this.itemsRepository = itemsRepository;
        this.selectedRepository = selectedRepository;
        this.sortingRepository = sortingRepository;
        this.searchRepository = searchRepository;
        this.itemMapper = new TrashBinItemMapper();
        this.retentionPeriod = retentionPeriod;
        this.nameColumnId = nameColumnId;
        makeAutoObservable(this);
    }

    get vm() {
        return {
            items: this.mapItemsToDTOs(this.itemsRepository.getItems()),
            restoredItems: this.mapItemsToDTOs(this.itemsRepository.getRestoredItems()),
            selectedItems: this.mapItemsToDTOs(this.selectedRepository.getSelectedItems()),
            meta: MetaMapper.toDto(this.itemsRepository.getMeta()),
            sorting: this.sortingRepository.get().map(sort => SortingMapper.fromDTOtoColumn(sort)),
            loading: this.itemsRepository.getLoading(),
            isEmptyView: this.getIsEmptyView(),
            isSearchView: this.getIsSearchView(),
            searchQuery: this.searchRepository.get(),
            searchLabel: "Search all items",
            nameColumnId: this.nameColumnId || "id",
            retentionPeriod: this.getRetentionPeriod()
        };
    }

    getRestoredItemById(id: string) {
        const items = this.itemsRepository.getRestoredItems();
        const restoredItem = items.find(item => item.id === id);
        return restoredItem ? this.itemMapper.toDTO(restoredItem) : undefined;
    }

    private mapItemsToDTOs(items: TrashBinItem[]) {
        return items.map(item => this.itemMapper.toDTO(item));
    }

    private getIsEmptyView() {
        const loading = this.itemsRepository.getLoading();
        const items = this.itemsRepository.getItems();
        return !loading[LoadingActions.list] && !items.length;
    }

    private getIsSearchView() {
        const loading = this.itemsRepository.getLoading();
        const items = this.itemsRepository.getItems();
        const searchQuery = this.searchRepository.get();
        return !loading[LoadingActions.list] && !items.length && !!searchQuery;
    }

    private getRetentionPeriod() {
        if (this.retentionPeriod === 1) {
            return "1 day";
        }
        return `${this.retentionPeriod} days`;
    }
}
