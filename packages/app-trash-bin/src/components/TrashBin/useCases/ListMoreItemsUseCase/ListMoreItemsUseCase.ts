import { makeAutoObservable } from "mobx";
import { IListMoreItemsUseCase, ITrashBinItemsRepository } from "../../abstractions";

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
