import { makeAutoObservable } from "mobx";
import { TrashBinItem } from "@webiny/app-trash-bin-common";
import { ISelectedItemsRepository, ISelectItemsController } from "../abstractions";

export class SelectItemsController implements ISelectItemsController {
    private repository: ISelectedItemsRepository;

    constructor(repository: ISelectedItemsRepository) {
        this.repository = repository;
        makeAutoObservable(this);
    }

    async execute(items: TrashBinItem[]) {
        return await this.repository.selectItems(items);
    }
}
