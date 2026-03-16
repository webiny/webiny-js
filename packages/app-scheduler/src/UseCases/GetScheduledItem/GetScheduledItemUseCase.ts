import { makeAutoObservable } from "mobx";
import type { ISchedulerItemsRepository } from "~/Domain/index.js";
import type { IGetScheduledItemUseCase } from "./IGetScheduledItemUseCase.js";

export class GetScheduledItemUseCase implements IGetScheduledItemUseCase {
    private repository: ISchedulerItemsRepository;

    constructor(repository: ISchedulerItemsRepository) {
        this.repository = repository;
        makeAutoObservable(this);
    }

    async execute(id: string) {
        const items = this.repository.getItems();
        return items.find(item => item.id === id);
    }
}
