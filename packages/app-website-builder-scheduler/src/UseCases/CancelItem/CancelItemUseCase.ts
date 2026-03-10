import { makeAutoObservable } from "mobx";
import type { IWbSchedulerItemsRepository } from "~/Domain/Repositories/index.js";
import type { ICancelItemUseCase } from "./ICancelItemUseCase.js";

export class ScheduleCancelItemUseCase implements ICancelItemUseCase {
    private repository: IWbSchedulerItemsRepository;

    constructor(repository: IWbSchedulerItemsRepository) {
        this.repository = repository;
        makeAutoObservable(this);
    }

    async execute(id: string) {
        await this.repository.scheduleCancelItem(id);
    }
}
