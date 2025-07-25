import { makeAutoObservable } from "mobx";
import { ISchedulerItemsRepository } from "~/Domain";
import { IListItemsUseCase } from "./IListItemsUseCase";
import type { ISchedulerListExecuteParams } from "~/Gateways/index.js";

export class ListItemsUseCase implements IListItemsUseCase {
    private itemsRepository: ISchedulerItemsRepository;
    constructor(itemsRepository: ISchedulerItemsRepository) {
        this.itemsRepository = itemsRepository;
        makeAutoObservable(this);
    }

    async execute(params?: Omit<ISchedulerListExecuteParams, "modelId">) {
        await this.itemsRepository.listItems(params || {});
    }
}
