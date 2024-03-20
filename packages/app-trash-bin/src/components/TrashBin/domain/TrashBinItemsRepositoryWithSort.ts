import { makeAutoObservable } from "mobx";
import { ISortingRepository, SortingMapper } from "@webiny/app-utilities";
import { ITrashBinItemsRepository } from "~/components/TrashBin/abstractions";

export class TrashBinItemsRepositoryWithSort implements ITrashBinItemsRepository {
    private sortRepository: ISortingRepository;
    private trashBinRepository: ITrashBinItemsRepository;

    constructor(sortRepository: ISortingRepository, trashBinRepository: ITrashBinItemsRepository) {
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
}
