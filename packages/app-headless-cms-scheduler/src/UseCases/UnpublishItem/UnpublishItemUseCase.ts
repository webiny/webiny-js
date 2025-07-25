import { makeAutoObservable } from "mobx";
import { ISchedulerItemsRepository } from "~/Domain/Repositories";
import { IUnpublishItemUseCase } from "./IUnpublishItemUseCase";

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
