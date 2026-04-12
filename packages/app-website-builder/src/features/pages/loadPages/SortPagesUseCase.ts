import { SortPagesUseCase as UseCaseAbstraction, ListPagesRepository } from "./abstractions.js";
import { Sorting } from "@webiny/app-utils";

class SortPagesUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ListPagesRepository.Interface) {}

    async execute(params: UseCaseAbstraction.Params) {
        const sorts = params.sorts.map(sort => Sorting.create(sort));
        await this.repository.sortPages(sorts);
    }
}

export const SortPagesUseCase = UseCaseAbstraction.createImplementation({
    implementation: SortPagesUseCaseImpl,
    dependencies: [ListPagesRepository]
});
