import { makeAutoObservable } from "mobx";
import { ILoadingRepository, ITrashBinRepository } from "~/abstractions";
import { TrashBinEntry } from "~/domain/TrashBinEntry";
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

    getEntries() {
        return this.trashBinRepository.getEntries();
    }

    async listEntries(override: boolean, params = {}) {
        const loadingKey = override ? LoadingEnum.list : LoadingEnum.listMore;
        await this.runCallbackWithLoading(
            this.trashBinRepository.listEntries(override, params),
            loadingKey
        );
    }

    getLoading() {
        return this.loadingRepository.get();
    }

    getSort() {
        return this.trashBinRepository.getSort();
    }

    getSelectedEntries() {
        return this.trashBinRepository.getSelectedEntries();
    }

    getMeta() {
        return this.trashBinRepository.getMeta();
    }

    async deleteEntry(id: string) {
        return await this.runCallbackWithLoading(
            this.trashBinRepository.deleteEntry(id),
            LoadingEnum.delete
        );
    }

    async selectEntries(entries: TrashBinEntry[]) {
        return await this.trashBinRepository.selectEntries(entries);
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
