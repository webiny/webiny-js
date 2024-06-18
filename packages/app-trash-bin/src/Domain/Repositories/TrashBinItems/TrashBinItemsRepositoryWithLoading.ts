import { makeAutoObservable } from "mobx";
import { ILoadingRepository } from "@webiny/app-utils";
import { ITrashBinItemsRepository } from "./ITrashBinItemsRepository";
import { LoadingActions, TrashBinBulkActionsParams, TrashBinListQueryVariables } from "~/types";

export class TrashBinItemsRepositoryWithLoading implements ITrashBinItemsRepository {
    private loadingRepository: ILoadingRepository;
    private trashBinItemsRepository: ITrashBinItemsRepository;

    constructor(
        loadingRepository: ILoadingRepository,
        trashBinItemsRepository: ITrashBinItemsRepository
    ) {
        this.loadingRepository = loadingRepository;
        this.trashBinItemsRepository = trashBinItemsRepository;
        makeAutoObservable(this);
    }

    getItems() {
        return this.trashBinItemsRepository.getItems();
    }

    getRestoredItems() {
        return this.trashBinItemsRepository.getRestoredItems();
    }

    getMeta() {
        return this.trashBinItemsRepository.getMeta();
    }

    getLoading() {
        return this.loadingRepository.get();
    }

    async listItems(params?: TrashBinListQueryVariables) {
        await this.loadingRepository.runCallBack(
            this.trashBinItemsRepository.listItems(params),
            LoadingActions.list
        );
    }

    async listMoreItems() {
        await this.loadingRepository.runCallBack(
            this.trashBinItemsRepository.listMoreItems(),
            LoadingActions.listMore
        );
    }

    async deleteItem(id: string) {
        await this.loadingRepository.runCallBack(
            this.trashBinItemsRepository.deleteItem(id),
            LoadingActions.delete
        );
    }

    async restoreItem(id: string) {
        await this.loadingRepository.runCallBack(
            this.trashBinItemsRepository.restoreItem(id),
            LoadingActions.restore
        );
    }

    async bulkAction(params: TrashBinBulkActionsParams) {
        await this.trashBinItemsRepository.bulkAction(params);
    }
}
