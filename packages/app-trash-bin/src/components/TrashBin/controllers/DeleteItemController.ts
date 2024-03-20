import { makeAutoObservable } from "mobx";
import { IDeleteItemController, ITrashBinRepository } from "../abstractions";

export class DeleteItemController implements IDeleteItemController {
    private repository: ITrashBinRepository;

    constructor(repository: ITrashBinRepository) {
        this.repository = repository;
        makeAutoObservable(this);
    }

    async execute(id: string) {
        return await this.repository.deleteItem(id);
    }
}
