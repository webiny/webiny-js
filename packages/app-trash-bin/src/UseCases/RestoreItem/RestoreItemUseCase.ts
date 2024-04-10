import { makeAutoObservable } from "mobx";
import { ITrashBinItemsRepository } from "~/Domain/Repositories";
import { IRestoreItemUseCase } from "./IRestoreItemUseCase";

export class RestoreItemUseCase implements IRestoreItemUseCase {
    private repository: ITrashBinItemsRepository;

    constructor(repository: ITrashBinItemsRepository) {
        this.repository = repository;
        makeAutoObservable(this);
    }

    async execute(id: string) {
        await this.repository.restoreItem(id);
    }
}
