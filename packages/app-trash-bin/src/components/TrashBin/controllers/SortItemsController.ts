import { makeAutoObservable } from "mobx";
import { ITrashBinRepository } from "@webiny/app-trash-bin-common";
import { ISortItemsController } from "../abstractions";

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
