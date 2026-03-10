import { makeAutoObservable } from "mobx";
import type { IWbSchedulerItemsRepository } from "~/Domain/index.js";
import type { IListItemsUseCase } from "./IListItemsUseCase.js";
import type { IWbSchedulerListExecuteParams } from "~/Gateways/index.js";

export class ListItemsUseCase implements IListItemsUseCase {
    private itemsRepository: IWbSchedulerItemsRepository;

    constructor(itemsRepository: IWbSchedulerItemsRepository) {
        this.itemsRepository = itemsRepository;
        makeAutoObservable(this);
    }

    async execute(params?: Omit<IWbSchedulerListExecuteParams, "modelId">) {
        await this.itemsRepository.listItems(params || {});
    }
}
