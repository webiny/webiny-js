import { makeAutoObservable } from "mobx";
import { ITrashBinItemMapper, TrashBinItem } from "@webiny/app-trash-bin-common";
import {
    ILoadingRepository,
    IMetaRepository,
    ISortingRepository,
    MetaMapper,
    SortingMapper
} from "@webiny/app-utilities";
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
        await this.loadingRepository.init(LoadingEnum);

        const initTasks = [
            await this.selectedRepository.init(),
            await this.searchRepository.init(),
            await this.sortingRepository.init([{ field: "deletedOn", order: "desc" }]),
            await this.itemsRepository.init()
        ];
        await this.loadingRepository.runCallBack(Promise.all(initTasks), LoadingEnum.init);
    }

    get vm() {
        return {
            items: this.mapItemsToDTOs(this.itemsRepository.getItems()),
            selectedItems: this.mapItemsToDTOs(this.selectedRepository.getSelectedItems()),
            meta: MetaMapper.toDto(this.metaRepository.get()),
            sorting: this.sortingRepository.get().map(sort => SortingMapper.fromDTOtoColumn(sort)),
            loading: this.loadingRepository.get(),
            searchQuery: this.searchRepository.get(),
            searchLabel: "Search all items"
        };
    }

    private mapItemsToDTOs(items: TrashBinItem[]) {
        return items.map(item => this.itemMapper.toDTO(item));
    }
}
