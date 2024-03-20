import { makeAutoObservable } from "mobx";
import { ISortRepository, ITrashBinRepository } from "~/abstractions";
import { SortMapper } from "~/domain/SortMapper";
import { TrashBinItem } from "~/domain/TrashBinItem";

export class TrashBinRepositoryWithSort implements ITrashBinRepository {
    private sortRepository: ISortRepository;
    private trashBinRepository: ITrashBinRepository;

    constructor(sortRepository: ISortRepository, trashBinRepository: ITrashBinRepository) {
        this.sortRepository = sortRepository;
        this.trashBinRepository = trashBinRepository;
        makeAutoObservable(this);
    }

    async init(): Promise<void> {
        const sort = this.sortRepository.get().map(sort => SortMapper.fromDTOtoDb(sort));
        await this.trashBinRepository.init({ sort });
    }

    getItems() {
        const Items = this.trashBinRepository.getItems();
        return this.sortRepository.sortItems(Items);
    }

    async listItems(override: boolean, params = {}) {
        const sort = this.sortRepository.get().map(sort => SortMapper.fromDTOtoDb(sort));
        return await this.trashBinRepository.listItems(override, { sort, ...params });
    }

    async deleteItem(id: string) {
        return await this.trashBinRepository.deleteItem(id);
    }

    async selectItems(Items: TrashBinItem[]) {
        return await this.trashBinRepository.selectItems(Items);
    }

    getSelectedItems() {
        return this.trashBinRepository.getSelectedItems();
    }
}
