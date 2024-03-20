import { makeAutoObservable } from "mobx";
import { ISortItemsController, ITrashBinRepository } from "../abstractions";

export class SortItemsController implements ISortItemsController {
    private repository: ITrashBinRepository;

    constructor(repository: ITrashBinRepository) {
        this.repository = repository;
        makeAutoObservable(this);
    }

    async execute() {
        return await this.repository.listItems(true);
    }
}
