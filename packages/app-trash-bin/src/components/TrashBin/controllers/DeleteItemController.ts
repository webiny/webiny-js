import { makeAutoObservable } from "mobx";
import { ITrashBinRepository } from "@webiny/app-trash-bin-common";
import { IDeleteItemController } from "../abstractions";

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
