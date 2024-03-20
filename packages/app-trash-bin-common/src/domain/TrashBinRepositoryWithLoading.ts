import { makeAutoObservable } from "mobx";
import { ILoadingRepository, ITrashBinRepository } from "~/abstractions";
import { TrashBinItem } from "~/domain/TrashBinItem";
import { LoadingEnum } from "~/types";

export class TrashBinRepositoryWithLoading implements ITrashBinRepository {
    private loadingRepository: ILoadingRepository;
    private trashBinRepository: ITrashBinRepository;

    constructor(loadingRepository: ILoadingRepository, trashBinRepository: ITrashBinRepository) {
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

    getSelectedItems() {
        return this.trashBinRepository.getSelectedItems();
    }

    async selectItems(items: TrashBinItem[]) {
        return await this.trashBinRepository.selectItems(items);
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
