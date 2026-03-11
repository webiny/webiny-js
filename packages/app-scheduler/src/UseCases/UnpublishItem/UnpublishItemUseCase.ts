import { makeAutoObservable } from "mobx";
import type { ISchedulerItemsRepository } from "~/Domain/Repositories/index.js";
import type { IUnpublishItemUseCase } from "./IUnpublishItemUseCase.js";

export class ScheduleUnpublishItemUseCase implements IUnpublishItemUseCase {
    private repository: ISchedulerItemsRepository;

    constructor(repository: ISchedulerItemsRepository) {
        this.repository = repository;
        makeAutoObservable(this);
    }

    async execute(id: string, scheduleOn: Date) {
        await this.repository.scheduleUnpublishItem(id, scheduleOn);
    }
}
