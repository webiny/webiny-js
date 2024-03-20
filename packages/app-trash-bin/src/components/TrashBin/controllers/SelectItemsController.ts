import { makeAutoObservable } from "mobx";
import { TrashBinItem } from "@webiny/app-trash-bin-common";
import { ISelectItemsController, ITrashBinRepository } from "../abstractions";

export class SelectItemsController implements ISelectItemsController {
    private repository: ITrashBinRepository;

    constructor(repository: ITrashBinRepository) {
        this.repository = repository;
        makeAutoObservable(this);
    }

    async execute(items: TrashBinItem[]) {
        return await this.repository.selectItems(items);
    }
}
