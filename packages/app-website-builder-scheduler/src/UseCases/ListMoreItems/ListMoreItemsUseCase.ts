import { makeAutoObservable } from "mobx";
import type { IWbSchedulerItemsRepository } from "~/Domain/Repositories/index.js";
import type { IListMoreItemsUseCase } from "./IListMoreItemsUseCase.js";

export class ListMoreItemsUseCase implements IListMoreItemsUseCase {
    private itemsRepository: IWbSchedulerItemsRepository;

    constructor(itemsRepository: IWbSchedulerItemsRepository) {
        this.itemsRepository = itemsRepository;
        makeAutoObservable(this);
    }

    async execute() {
        await this.itemsRepository.listMoreItems();
    }
}
