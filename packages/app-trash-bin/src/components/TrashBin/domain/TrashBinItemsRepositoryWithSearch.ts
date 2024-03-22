import { makeAutoObservable } from "mobx";
import { TrashBinListQueryVariables } from "@webiny/app-trash-bin-common/types";
import { ISearchRepository, ITrashBinItemsRepository } from "~/components/TrashBin/abstractions";

export class TrashBinItemsRepositoryWithSearch implements ITrashBinItemsRepository {
    private searchRepository: ISearchRepository;
    private repository: ITrashBinItemsRepository;

    constructor(searchRepository: ISearchRepository, repository: ITrashBinItemsRepository) {
        this.searchRepository = searchRepository;
        this.repository = repository;
        makeAutoObservable(this);
    }

    async init(params = {}) {
        await this.searchRepository.init();
        await this.repository.init(params);
    }

    getItems() {
        return this.repository.getItems();
    }

    async listItems(params?: TrashBinListQueryVariables) {
        const query = this.searchRepository.get();
        await this.repository.listItems({ ...params, search: query || undefined });
    }

    async deleteItem(id: string) {
        await this.repository.deleteItem(id);
    }
}
