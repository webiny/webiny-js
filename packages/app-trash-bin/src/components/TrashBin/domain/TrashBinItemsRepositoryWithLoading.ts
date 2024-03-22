import { makeAutoObservable } from "mobx";
import { TrashBinListQueryVariables } from "@webiny/app-trash-bin-common/types";
import { ITrashBinItemsRepository } from "~/components/TrashBin/abstractions";
import { ILoadingRepository } from "@webiny/app-utils";
import { LoadingEnum } from "~/types";

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
        await this.loadingRepository.runCallBack(this.repository.init(params), LoadingEnum.init);
    }

    getItems() {
        return this.repository.getItems();
    }

    async listItems(params?: TrashBinListQueryVariables) {
        const loadingKey = params?.after ? LoadingEnum.listMore : LoadingEnum.list;
        await this.loadingRepository.runCallBack(this.repository.listItems(params), loadingKey);
    }

    async deleteItem(id: string) {
        await this.loadingRepository.runCallBack(
            this.repository.deleteItem(id),
            LoadingEnum.delete
        );
    }
}
