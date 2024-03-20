import { makeAutoObservable } from "mobx";
import { IDeleteItemController, ITrashBinItemsRepository } from "../abstractions";

export class DeleteItemController implements IDeleteItemController {
    private repository: ITrashBinItemsRepository;

    constructor(repository: ITrashBinItemsRepository) {
        this.repository = repository;
        makeAutoObservable(this);
    }

    async execute(id: string) {
        return await this.repository.deleteItem(id);
    }
}
