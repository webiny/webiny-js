import { makeAutoObservable } from "mobx";
import { ITrashBinItemsRepository } from "~/Domain";
import { IGetRestoredItemUseCase } from "./IGetRestoredItemUseCase";

export class GetRestoredItemUseCase implements IGetRestoredItemUseCase {
    private repository: ITrashBinItemsRepository;

    constructor(repository: ITrashBinItemsRepository) {
        this.repository = repository;
        makeAutoObservable(this);
    }

    async execute(id: string) {
        const items = this.repository.getRestoredItems();
        return items.find(item => item.id === id);
    }
}
