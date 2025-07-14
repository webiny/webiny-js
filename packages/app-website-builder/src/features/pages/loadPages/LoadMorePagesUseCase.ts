import type { ILoadMorePagesUseCase } from "~/features/pages/loadPages/ILoadMorePagesUseCase.js";
import type { IListPagesRepository } from "~/features/pages/loadPages/IListPagesRepository.js";

export class LoadMorePagesUseCase implements ILoadMorePagesUseCase {
    private repository: IListPagesRepository;

    constructor(repository: IListPagesRepository) {
        this.repository = repository;
    }

    async execute() {
        await this.repository.loadMorePages();
    }
}
