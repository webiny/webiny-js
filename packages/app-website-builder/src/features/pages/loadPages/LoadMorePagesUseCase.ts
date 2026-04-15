import { LoadMorePagesUseCase as UseCaseAbstraction, ListPagesRepository } from "./abstractions.js";

class LoadMorePagesUseCaseImpl implements UseCaseAbstraction.Interface {
    constructor(private repository: ListPagesRepository.Interface) {}

    async execute() {
        await this.repository.loadMorePages();
    }
}

export const LoadMorePagesUseCase = UseCaseAbstraction.createImplementation({
    implementation: LoadMorePagesUseCaseImpl,
    dependencies: [ListPagesRepository]
});
