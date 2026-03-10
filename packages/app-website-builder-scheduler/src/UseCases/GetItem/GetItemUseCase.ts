import { makeAutoObservable } from "mobx";
import type { IWbSchedulerItemsRepository } from "~/Domain/index.js";
import type { IGetItemUseCase } from "./IGetItemUseCase.js";
import type { IWbSchedulerGetExecuteParams } from "~/Gateways/index.js";

export class GetItemUseCase implements IGetItemUseCase {
    private itemsRepository: IWbSchedulerItemsRepository;

    constructor(itemsRepository: IWbSchedulerItemsRepository) {
        this.itemsRepository = itemsRepository;
        makeAutoObservable(this);
    }

    async execute(params: Omit<IWbSchedulerGetExecuteParams, "modelId">) {
        return await this.itemsRepository.getItem(params);
    }
}
