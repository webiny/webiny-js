import { makeAutoObservable } from "mobx";
import { ISearchItemsUseCase, ISearchRepository } from "../../abstractions";

export class SearchItemsUseCase implements ISearchItemsUseCase {
    private searchRepository: ISearchRepository;

    constructor(searchRepository: ISearchRepository) {
        this.searchRepository = searchRepository;
        makeAutoObservable(this);
    }

    async execute(query: string) {
        await this.searchRepository.set(query);
    }
}
