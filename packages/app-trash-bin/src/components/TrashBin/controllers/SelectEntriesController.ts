import { makeAutoObservable } from "mobx";
import { ITrashBinRepository, TrashBinEntry } from "@webiny/app-trash-bin-common";
import { ISelectEntriesController } from "../abstractions";

export class SelectEntriesController implements ISelectEntriesController {
    private repository: ITrashBinRepository;

    constructor(repository: ITrashBinRepository) {
        this.repository = repository;
        makeAutoObservable(this);
    }

    async execute(entries: TrashBinEntry[]) {
        return await this.repository.selectEntries(entries);
    }
}
