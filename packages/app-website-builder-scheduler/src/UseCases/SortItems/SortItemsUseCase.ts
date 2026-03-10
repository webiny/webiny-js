import { makeAutoObservable } from "mobx";
import type { ISortingRepository, SortingDTO } from "@webiny/app-utils";
import type { ISortItemsUseCase } from "./ISortItemsUseCase.js";

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
