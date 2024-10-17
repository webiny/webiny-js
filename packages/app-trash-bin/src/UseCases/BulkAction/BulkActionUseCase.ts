import { makeAutoObservable } from "mobx";
import { ITrashBinItemsRepository } from "~/Domain/Repositories";
import { IBulkActionUseCase } from "./IBulkActionUseCase";
import { TrashBinBulkActionsParams } from "~/types";

export class BulkActionUseCase implements IBulkActionUseCase {
    private repository: ITrashBinItemsRepository;

    constructor(repository: ITrashBinItemsRepository) {
        this.repository = repository;
        makeAutoObservable(this);
    }

    async execute(action: string, params: TrashBinBulkActionsParams) {
        await this.repository.bulkAction(action, params);
    }
}
