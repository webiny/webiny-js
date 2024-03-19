import { makeAutoObservable } from "mobx";
import { ITrashBinRepository } from "@webiny/app-trash-bin-common";
import { IDeleteEntryController } from "../abstractions";

export class DeleteEntryController implements IDeleteEntryController {
    private repository: ITrashBinRepository;

    constructor(repository: ITrashBinRepository) {
        this.repository = repository;
        makeAutoObservable(this);
    }

    async execute(id: string) {
        return await this.repository.deleteEntry(id);
    }
}
