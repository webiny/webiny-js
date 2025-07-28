import type {
    ISortRedirectsUseCase,
    SortRedirectsUseCaseParams
} from "~/features/redirects/loadRedirects/ISortRedirectsUseCase.js";
import type { IListRedirectsRepository } from "~/features/redirects/loadRedirects/IListRedirectsRepository.js";
import { Sorting } from "@webiny/app-utils";

export class SortRedirectsUseCase implements ISortRedirectsUseCase {
    private repository: IListRedirectsRepository;

    constructor(repository: IListRedirectsRepository) {
        this.repository = repository;
    }

    async execute(params: SortRedirectsUseCaseParams) {
        const sorts = params.sorts.map(sort => Sorting.create(sort));
        await this.repository.sortRedirects(sorts);
    }
}
