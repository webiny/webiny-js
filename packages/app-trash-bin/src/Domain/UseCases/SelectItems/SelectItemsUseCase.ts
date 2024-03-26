import { makeAutoObservable } from "mobx";
import { TrashBinItem } from "@webiny/app-trash-bin-common";
import { ISelectedItemsRepository } from "~/Domain/Repositories";
import { ISelectItemsUseCase } from "./ISelectItemsUseCase";

export class SelectItemsUseCase implements ISelectItemsUseCase {
    private repository: ISelectedItemsRepository;

    constructor(repository: ISelectedItemsRepository) {
        this.repository = repository;
        makeAutoObservable(this);
    }

    async execute(items: TrashBinItem[]) {
        await this.repository.selectItems(items);
    }
}
