import { makeAutoObservable } from "mobx";
import { TrashBinItem } from "@webiny/app-trash-bin-common";
import { ISelectedItemsRepository, ISelectItemsUseCase } from "../../abstractions";

export class SelectItemsUseCase implements ISelectItemsUseCase {
    private repository: ISelectedItemsRepository;

    constructor(repository: ISelectedItemsRepository) {
        this.repository = repository;
        makeAutoObservable(this);
    }

    async execute(items: TrashBinItem[]) {
        return await this.repository.selectItems(items);
    }
}
