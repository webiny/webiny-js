import { makeAutoObservable } from "mobx";
import { ISchedulerItemsRepository } from "~/Domain/Repositories";
import { IListMoreItemsUseCase } from "./IListMoreItemsUseCase";

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
