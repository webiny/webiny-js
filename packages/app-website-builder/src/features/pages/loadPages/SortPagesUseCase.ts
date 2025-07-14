import type {
    ISortPagesUseCase,
    SortPagesUseCaseParams
} from "~/features/pages/loadPages/ISortPagesUseCase.js";
import type { IListPagesRepository } from "~/features/pages/loadPages/IListPagesRepository.js";
import { Sorting } from "@webiny/app-utils";

export class SortPagesUseCase implements ISortPagesUseCase {
    private repository: IListPagesRepository;

    constructor(repository: IListPagesRepository) {
        this.repository = repository;
    }

    async execute(params: SortPagesUseCaseParams) {
        const sorts = params.sorts.map(sort => Sorting.create(sort));
        await this.repository.sortPages(sorts);
    }
}
