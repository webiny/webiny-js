import { makeAutoObservable } from "mobx";
import type { IWbSchedulerItemsRepository } from "~/Domain/Repositories/index.js";
import type { IUnpublishItemUseCase } from "./IUnpublishItemUseCase.js";

export class ScheduleUnpublishItemUseCase implements IUnpublishItemUseCase {
    private repository: IWbSchedulerItemsRepository;

    constructor(repository: IWbSchedulerItemsRepository) {
        this.repository = repository;
        makeAutoObservable(this);
    }

    async execute(id: string, scheduleOn: Date) {
        await this.repository.scheduleUnpublishItem(id, scheduleOn);
    }
}
