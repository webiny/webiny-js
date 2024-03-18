import { makeAutoObservable } from "mobx";
import { ISortRepository, ITrashBinRepository } from "~/abstractions";
import { SortMapper } from "~/domain/SortMapper";
import { TrashBinEntry } from "~/domain/TrashBinEntry";

export class TrashBinRepositoryWithSort implements ITrashBinRepository {
    private sortRepository: ISortRepository;
    private trashBinRepository: ITrashBinRepository;

    constructor(sortRepository: ISortRepository, trashBinRepository: ITrashBinRepository) {
        this.sortRepository = sortRepository;
        this.trashBinRepository = trashBinRepository;
        makeAutoObservable(this);
    }

    async init(): Promise<void> {
        await this.trashBinRepository.init();
        await this.sortRepository.init();
    }

    getEntries() {
        const entries = this.trashBinRepository.getEntries();
        return this.sortRepository.sortEntries(entries);
    }

    async listEntries(override: boolean, params = {}) {
        const sort = this.sortRepository.get().map(sort => SortMapper.fromDTOtoDb(sort));
        return await this.trashBinRepository.listEntries(override, { sort, ...params });
    }

    getSort() {
        return this.sortRepository.get();
    }

    getSelectedEntries() {
        return this.trashBinRepository.getSelectedEntries();
    }

    getLoading() {
        return this.trashBinRepository.getLoading();
    }

    getMeta() {
        return this.trashBinRepository.getMeta();
    }

    async deleteEntry(id: string) {
        return await this.trashBinRepository.deleteEntry(id);
    }

    async selectEntries(entries: TrashBinEntry[]) {
        return await this.trashBinRepository.selectEntries(entries);
    }
}
