import type { ISelectedItemsRepository } from "~/domain/SelectedItem/index.js";
import type { ISelectPagesUseCase } from "~/features/pages/selectPages/ISelectPagesUseCases.js";

export class SelectPagesUseCase<T = any> implements ISelectPagesUseCase<T> {
    private repository: ISelectedItemsRepository<T>;

    constructor(repository: ISelectedItemsRepository<T>) {
        this.repository = repository;
    }

    async execute(pages: T[]) {
        await this.repository.selectItems(pages);
    }
}
