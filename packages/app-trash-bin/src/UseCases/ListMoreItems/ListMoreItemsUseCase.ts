import { makeAutoObservable } from "mobx";
import { ITrashBinItemsRepository } from "~/Domain/Repositories";
import { IListMoreItemsUseCase } from "./IListMoreItemsUseCase";

export class ListMoreItemsUseCase implements IListMoreItemsUseCase {
    private itemsRepository: ITrashBinItemsRepository;

    constructor(itemsRepository: ITrashBinItemsRepository) {
        this.itemsRepository = itemsRepository;
        makeAutoObservable(this);
    }

    async execute() {
        await this.itemsRepository.listMoreItems();
    }
}
