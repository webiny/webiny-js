import { makeAutoObservable } from "mobx";
import { TrashBinListQueryVariables } from "@webiny/app-trash-bin-common/types";
import { ITrashBinItemsRepository } from "~/components/TrashBin/abstractions";
import { ILoadingRepository } from "@webiny/app-utils";
import { LoadingActions } from "~/types";

export class TrashBinItemsRepositoryWithLoading implements ITrashBinItemsRepository {
    private loadingRepository: ILoadingRepository;
    private repository: ITrashBinItemsRepository;

    constructor(loadingRepository: ILoadingRepository, repository: ITrashBinItemsRepository) {
        this.loadingRepository = loadingRepository;
        this.repository = repository;
        makeAutoObservable(this);
    }

    async init(params = {}) {
        await this.loadingRepository.init();
        await this.loadingRepository.runCallBack(this.repository.init(params), LoadingActions.init);
    }

    getItems() {
        return this.repository.getItems();
    }

    async listItems(params?: TrashBinListQueryVariables) {
        const action = params?.after ? LoadingActions.listMore : LoadingActions.list;
        await this.loadingRepository.runCallBack(this.repository.listItems(params), action);
    }

    async deleteItem(id: string) {
        await this.loadingRepository.runCallBack(
            this.repository.deleteItem(id),
            LoadingActions.delete
        );
    }
}
