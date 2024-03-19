import { makeAutoObservable } from "mobx";
import { ITrashBinRepository } from "@webiny/app-trash-bin-common";
import { ISortEntriesController } from "../abstractions";

export class SortEntriesController implements ISortEntriesController {
    private repository: ITrashBinRepository;

    constructor(repository: ITrashBinRepository) {
        this.repository = repository;
        makeAutoObservable(this);
    }

    async execute() {
        return await this.repository.listEntries(true);
    }
}
