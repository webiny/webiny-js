import { makeAutoObservable } from "mobx";
import { ILoadingRepository } from "@webiny/app-utilities";
import { ITrashBinItemsRepository } from "~/components/TrashBin/abstractions";
import { LoadingEnum } from "~/types";

export class TrashBinItemsRepositoryWithLoading implements ITrashBinItemsRepository {
    private loadingRepository: ILoadingRepository;
    private trashBinRepository: ITrashBinItemsRepository;

    constructor(
        loadingRepository: ILoadingRepository,
        trashBinRepository: ITrashBinItemsRepository
    ) {
        this.loadingRepository = loadingRepository;
        this.trashBinRepository = trashBinRepository;
        makeAutoObservable(this);
    }

    async init(): Promise<void> {
        await this.loadingRepository.init(LoadingEnum);
        await this.runCallbackWithLoading(this.trashBinRepository.init(), LoadingEnum.init);
    }

    async listItems(override: boolean, params = {}) {
        const loadingKey = override ? LoadingEnum.list : LoadingEnum.listMore;
        await this.runCallbackWithLoading(
            this.trashBinRepository.listItems(override, params),
            loadingKey
        );
    }

    async deleteItem(id: string) {
        return await this.runCallbackWithLoading(
            this.trashBinRepository.deleteItem(id),
            LoadingEnum.delete
        );
    }

    getItems() {
        return this.trashBinRepository.getItems();
    }

    private async runCallbackWithLoading<T>(
        callback: Promise<T>,
        key: LoadingEnum
    ): Promise<T | undefined> {
        await this.loadingRepository.set(key, true);
        const result = await callback;
        await this.loadingRepository.set(key, false);
        return result;
    }
}
