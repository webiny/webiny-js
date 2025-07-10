import type {
    ISortPagesUseCase,
    SortPagesUseCaseParams
} from "~/features/pages/loadPages/ISortPagesUseCase.js";
import type { ILoadPagesRepository } from "~/features/pages/loadPages/ILoadPagesRepository.js";
import { Sorting } from "@webiny/app-utils";

export class SortPagesUseCase implements ISortPagesUseCase {
    private repository: ILoadPagesRepository;

    constructor(repository: ILoadPagesRepository) {
        this.repository = repository;
    }

    async execute(params: SortPagesUseCaseParams) {
        const sorts = params.sorts.map(sort => Sorting.create(sort));
        await this.repository.sortPages(sorts);
    }
}
