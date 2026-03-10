import { makeAutoObservable } from "mobx";
import type { WbSchedulerItem, ISelectedItemsRepository } from "~/Domain/index.js";
import type { ISelectItemsUseCase } from "./ISelectItemsUseCase.js";

export class SelectItemsUseCase implements ISelectItemsUseCase {
    private repository: ISelectedItemsRepository;

    constructor(repository: ISelectedItemsRepository) {
        this.repository = repository;
        makeAutoObservable(this);
    }

    async execute(items: WbSchedulerItem[]) {
        await this.repository.selectItems(items);
    }
}
