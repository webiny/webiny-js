import type { ILoadMoreRedirectsUseCase } from "~/features/redirects/loadRedirects/ILoadMoreRedirectsUseCase.js";
import type { IListRedirectsRepository } from "~/features/redirects/loadRedirects/IListRedirectsRepository.js";

export class LoadMoreRedirectsUseCase implements ILoadMoreRedirectsUseCase {
    private repository: IListRedirectsRepository;

    constructor(repository: IListRedirectsRepository) {
        this.repository = repository;
    }

    async execute() {
        await this.repository.loadMoreRedirects();
    }
}
