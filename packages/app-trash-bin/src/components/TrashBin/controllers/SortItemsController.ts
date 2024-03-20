import { makeAutoObservable } from "mobx";
import { ISortItemsController, ITrashBinItemsRepository } from "../abstractions";

export class SortItemsController implements ISortItemsController {
    private repository: ITrashBinItemsRepository;

    constructor(repository: ITrashBinItemsRepository) {
        this.repository = repository;
        makeAutoObservable(this);
    }

    async execute() {
        return await this.repository.listItems(true);
    }
}
