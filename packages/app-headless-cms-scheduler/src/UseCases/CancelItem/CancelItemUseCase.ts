import { makeAutoObservable } from "mobx";
import { ISchedulerItemsRepository } from "~/Domain/Repositories";
import { ICancelItemUseCase } from "./ICancelItemUseCase";

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
