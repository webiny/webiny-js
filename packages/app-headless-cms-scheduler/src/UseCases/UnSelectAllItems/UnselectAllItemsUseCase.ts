import { makeAutoObservable } from "mobx";
import { ISelectedItemsRepository } from "~/Domain";
import { IUnselectAllItemsUseCase } from "./IUnselectAllItemsUseCase";

export class UnselectAllItemsUseCase implements IUnselectAllItemsUseCase {
    private repository: ISelectedItemsRepository;

    constructor(repository: ISelectedItemsRepository) {
        this.repository = repository;
        makeAutoObservable(this);
    }

    async execute() {
        await this.repository.unselectAllItems();
    }
}
