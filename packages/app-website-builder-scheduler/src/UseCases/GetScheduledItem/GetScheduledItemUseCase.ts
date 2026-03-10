import { makeAutoObservable } from "mobx";
import type { IWbSchedulerItemsRepository } from "~/Domain/index.js";
import type { IGetScheduledItemUseCase } from "./IGetScheduledItemUseCase.js";

export class GetScheduledItemUseCase implements IGetScheduledItemUseCase {
    private repository: IWbSchedulerItemsRepository;

    constructor(repository: IWbSchedulerItemsRepository) {
        this.repository = repository;
        makeAutoObservable(this);
    }

    async execute(id: string) {
        const items = this.repository.getItems();
        return items.find(item => item.id === id);
    }
}
