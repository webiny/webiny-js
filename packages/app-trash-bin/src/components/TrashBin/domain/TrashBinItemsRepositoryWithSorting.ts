import { makeAutoObservable } from "mobx";
import { TrashBinListQueryVariables } from "@webiny/app-trash-bin-common/types";
import { ITrashBinItemsRepository } from "~/components/TrashBin/abstractions";
import { DbSorting, ISortingRepository, SortingMapper } from "@webiny/app-utils";

export class TrashBinItemsRepositoryWithSorting implements ITrashBinItemsRepository {
    private sortingRepository: ISortingRepository;
    private repository: ITrashBinItemsRepository;

    constructor(sortingRepository: ISortingRepository, repository: ITrashBinItemsRepository) {
        this.sortingRepository = sortingRepository;
        this.repository = repository;
        makeAutoObservable(this);
    }

    async init(params = {}) {
        await this.sortingRepository.init();
        const sort = this.getDbSort();
        await this.repository.init({ ...params, sort });
    }

    getItems() {
        return this.repository.getItems();
    }

    async listItems(params?: TrashBinListQueryVariables) {
        const sort = this.getDbSort();
        await this.repository.listItems({ ...params, sort });
    }

    async deleteItem(id: string) {
        await this.repository.deleteItem(id);
    }

    private getDbSort(): DbSorting[] {
        return this.sortingRepository.get().map(sort => SortingMapper.fromDTOtoDb(sort));
    }
}
