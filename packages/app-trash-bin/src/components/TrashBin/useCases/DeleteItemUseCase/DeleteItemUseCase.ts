import { makeAutoObservable } from "mobx";
import { IDeleteItemUseCase, ITrashBinItemsRepository } from "../../abstractions";

export class DeleteItemUseCase implements IDeleteItemUseCase {
    private repository: ITrashBinItemsRepository;

    constructor(repository: ITrashBinItemsRepository) {
        this.repository = repository;
        makeAutoObservable(this);
    }

    async execute(id: string) {
        return await this.repository.deleteItem(id);
    }
}
