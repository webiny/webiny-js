import { makeAutoObservable } from "mobx";
import type { ISchedulerItemsRepository } from "~/Domain/Repositories/index.js";
import type { IListMoreItemsUseCase } from "./IListMoreItemsUseCase.js";

export class ListMoreItemsUseCase implements IListMoreItemsUseCase {
    private itemsRepository: ISchedulerItemsRepository;

    constructor(itemsRepository: ISchedulerItemsRepository) {
        this.itemsRepository = itemsRepository;
        makeAutoObservable(this);
    }

    async execute() {
        await this.itemsRepository.listMoreItems();
    }
}
