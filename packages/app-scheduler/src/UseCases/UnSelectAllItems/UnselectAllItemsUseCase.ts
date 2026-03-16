import { makeAutoObservable } from "mobx";
import type { ISelectedItemsRepository } from "~/Domain/index.js";
import type { IUnselectAllItemsUseCase } from "./IUnselectAllItemsUseCase.js";

export class UnselectAllItemsUseCase implements IUnselectAllItemsUseCase {
    private repository: ISelectedItemsRepository;

    constructor(repository: ISelectedItemsRepository) {
        this.repository = repository;
        makeAutoObservable(this);
    }

    async execute() {
        await this.repository.unselectAllItems();
    }
}
