import type { ILoadMorePagesUseCase } from "~/features/pages/loadPages/ILoadMorePagesUseCase.js";
import type { ILoadPagesRepository } from "~/features/pages/loadPages/ILoadPagesRepository.js";

export class LoadMorePagesUseCase implements ILoadMorePagesUseCase {
    private repository: ILoadPagesRepository;

    constructor(repository: ILoadPagesRepository) {
        this.repository = repository;
    }

    async execute() {
        await this.repository.loadMorePages();
    }
}
