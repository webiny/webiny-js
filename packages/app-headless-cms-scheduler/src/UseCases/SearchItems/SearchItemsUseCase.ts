import { makeAutoObservable } from "mobx";
import { ISearchItemsUseCase } from "./ISearchItemsUseCase";
import { ISearchRepository } from "~/Domain/Repositories";

export class SearchItemsUseCase implements ISearchItemsUseCase {
    private searchRepository: ISearchRepository;

    constructor(searchRepository: ISearchRepository) {
        this.searchRepository = searchRepository;
        makeAutoObservable(this);
    }

    async execute(value: string) {
        await this.searchRepository.set(value);
    }
}
