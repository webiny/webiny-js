import { makeAutoObservable } from "mobx";
import { TrashBinItem } from "@webiny/app-trash-bin-common";
import { ISortingRepository, SortingMapper } from "@webiny/app-utilities";
import { ITrashBinRepository } from "~/components/TrashBin/abstractions";

export class TrashBinRepositoryWithSort implements ITrashBinRepository {
    private sortRepository: ISortingRepository;
    private trashBinRepository: ITrashBinRepository;

    constructor(sortRepository: ISortingRepository, trashBinRepository: ITrashBinRepository) {
        this.sortRepository = sortRepository;
        this.trashBinRepository = trashBinRepository;
        makeAutoObservable(this);
    }

    async init(): Promise<void> {
        const sort = this.sortRepository.get().map(sort => SortingMapper.fromDTOtoDb(sort));
        await this.trashBinRepository.init({ sort });
    }

    getItems() {
        const Items = this.trashBinRepository.getItems();
        return this.sortRepository.sortItems(Items);
    }

    async listItems(override: boolean, params = {}) {
        const sort = this.sortRepository.get().map(sort => SortingMapper.fromDTOtoDb(sort));
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
