import { makeAutoObservable } from "mobx";
import { ITrashBinRepository, TrashBinItem } from "@webiny/app-trash-bin-common";
import { ISelectItemsController } from "../abstractions";

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
