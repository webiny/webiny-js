import { makeAutoObservable } from "mobx";
import type { ISortingRepository } from "@webiny/app-utils";
import { MetaMapper, SortingMapper } from "@webiny/app-utils";
import type {
    ISchedulerItemsRepository,
    ISearchRepository,
    ISelectedItemsRepository
} from "~/Domain/Repositories/index.js";
import { LoadingActions } from "~/types.js";

export interface ISchedulerPresenterParams {
    itemsRepository: ISchedulerItemsRepository;
    selectedRepository: ISelectedItemsRepository;
    sortingRepository: ISortingRepository;
    searchRepository: ISearchRepository;
}

export class SchedulerPresenter {
    private readonly itemsRepository: ISchedulerItemsRepository;
    private readonly selectedRepository: ISelectedItemsRepository;
    private readonly sortingRepository: ISortingRepository;
    private readonly searchRepository: ISearchRepository;

    public constructor(params: ISchedulerPresenterParams) {
        this.itemsRepository = params.itemsRepository;
        this.selectedRepository = params.selectedRepository;
        this.sortingRepository = params.sortingRepository;
        this.searchRepository = params.searchRepository;
        makeAutoObservable(this);
    }

    public get vm() {
        return {
            items: this.itemsRepository.getItems(),
            selectedItems: this.selectedRepository.getSelectedItems(),
            allowSelectAll: this.getAllowSelectAll(),
            isSelectedAll: this.selectedRepository.getSelectedAllItems(),
            meta: MetaMapper.toDto(this.itemsRepository.getMeta()),
            sorting: this.sortingRepository.get().map(sort => SortingMapper.fromDTOtoColumn(sort)),
            loading: this.itemsRepository.getLoading(),
            isEmptyView: this.getIsEmptyView(),
            isSearchView: this.getIsSearchView(),
            searchQuery: this.searchRepository.get(),
            searchLabel: "Search all items",
            nameColumnId: "title"
        };
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
    private getAllowSelectAll() {
        return (
            this.itemsRepository.getMeta().hasMoreItems &&
            !!this.itemsRepository.getItems().length &&
            this.selectedRepository.getSelectedItems().length ===
                this.itemsRepository.getItems().length
        );
    }
}
