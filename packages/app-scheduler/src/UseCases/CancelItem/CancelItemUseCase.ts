import { makeAutoObservable } from "mobx";
import type { ISchedulerItemsRepository } from "~/Domain/Repositories/index.js";
import type { ICancelItemUseCase } from "./ICancelItemUseCase.js";

export class ScheduleCancelItemUseCase implements ICancelItemUseCase {
    private repository: ISchedulerItemsRepository;

    constructor(repository: ISchedulerItemsRepository) {
        this.repository = repository;
        makeAutoObservable(this);
    }

    async execute(id: string) {
        await this.repository.scheduleCancelItem(id);
    }
}
