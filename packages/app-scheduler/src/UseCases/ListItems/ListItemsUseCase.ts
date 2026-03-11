import { makeAutoObservable } from "mobx";
import type { ISchedulerItemsRepository } from "~/Domain/index.js";
import type { IListItemsUseCase } from "./IListItemsUseCase.js";
import type { IListScheduleActionsExecuteParams } from "~/Gateways/index.js";

export class ListItemsUseCase implements IListItemsUseCase {
    private itemsRepository: ISchedulerItemsRepository;
    constructor(itemsRepository: ISchedulerItemsRepository) {
        this.itemsRepository = itemsRepository;
        makeAutoObservable(this);
    }

    async execute(params?: Omit<IListScheduleActionsExecuteParams, "app">) {
        await this.itemsRepository.listItems(params);
    }
}
