import { makeAutoObservable } from "mobx";
import {
    ISearchItemsUseCase,
    ISearchRepository,
    ITrashBinItemsRepository
} from "../../abstractions";

export class SearchItemsUseCase implements ISearchItemsUseCase {
    private itemsRepository: ITrashBinItemsRepository;
    private searchRepository: ISearchRepository;

    constructor(itemsRepository: ITrashBinItemsRepository, searchRepository: ISearchRepository) {
        this.itemsRepository = itemsRepository;
        this.searchRepository = searchRepository;
        makeAutoObservable(this);
    }

    async execute(query: string) {
        await this.searchRepository.set(query);
        await this.itemsRepository.listItems({ search: query || undefined });
    }
}
