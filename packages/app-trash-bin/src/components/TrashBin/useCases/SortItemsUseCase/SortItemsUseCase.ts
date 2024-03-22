import { makeAutoObservable } from "mobx";
import { ISortingRepository, SortingDTO } from "@webiny/app-utils";
import { ISortItemsUseCase } from "../../abstractions";

export class SortItemsUseCase implements ISortItemsUseCase {
    private sortingRepository: ISortingRepository;

    constructor(sortingRepository: ISortingRepository) {
        this.sortingRepository = sortingRepository;
        makeAutoObservable(this);
    }

    async execute(sorts: SortingDTO[]) {
        this.sortingRepository.set(sorts);
    }
}
