import type { ISelectedItemsRepository } from "~/domain/SelectedItem/index.js";
import type { ISelectRedirectsUseCase } from "~/features/redirects/selectRedirects/ISelectRedirectsUseCases.js";

export class SelectRedirectsUseCase<T = any> implements ISelectRedirectsUseCase<T> {
    private repository: ISelectedItemsRepository<T>;

    constructor(repository: ISelectedItemsRepository<T>) {
        this.repository = repository;
    }

    async execute(redirects: T[]) {
        await this.repository.selectItems(redirects);
    }
}
