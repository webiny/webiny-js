import { makeAutoObservable } from "mobx";
import { ISchedulerItemsRepository } from "~/Domain";
import { IGetItemUseCase } from "./IGetItemUseCase";
import type { ISchedulerGetExecuteParams } from "~/Gateways/index.js";

export class GetItemUseCase implements IGetItemUseCase {
    private itemsRepository: ISchedulerItemsRepository;
    constructor(itemsRepository: ISchedulerItemsRepository) {
        this.itemsRepository = itemsRepository;
        makeAutoObservable(this);
    }

    async execute(params: Omit<ISchedulerGetExecuteParams, "modelId">) {
        return await this.itemsRepository.getItem(params);
    }
}
