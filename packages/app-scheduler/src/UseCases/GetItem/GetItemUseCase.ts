import { makeAutoObservable } from "mobx";
import type { ISchedulerItemsRepository } from "~/Domain/index.js";
import type { IGetItemUseCase } from "./IGetItemUseCase.js";
import type { IGetScheduleActionGatewayExecuteParams } from "~/Gateways/index.js";

export class GetItemUseCase implements IGetItemUseCase {
    private itemsRepository: ISchedulerItemsRepository;
    constructor(itemsRepository: ISchedulerItemsRepository) {
        this.itemsRepository = itemsRepository;
        makeAutoObservable(this);
    }

    async execute(params: Omit<IGetScheduleActionGatewayExecuteParams, "app">) {
        return await this.itemsRepository.getItem(params);
    }
}
