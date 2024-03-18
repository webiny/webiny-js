import { makeAutoObservable } from "mobx";
import {
    ITrashBinController,
    ITrashBinRepository,
    TrashBinEntry
} from "@webiny/app-trash-bin-common";
import { TrashBinListQueryVariables } from "@webiny/app-trash-bin-common/types";

export class TrashBinController implements ITrashBinController {
    private repository: ITrashBinRepository;

    constructor(repository: ITrashBinRepository) {
        this.repository = repository;
        makeAutoObservable(this);
    }

    async listMoreEntries(params?: TrashBinListQueryVariables) {
        const { hasMoreItems, cursor } = this.repository.getMeta();

        if (hasMoreItems && cursor) {
            return await this.repository.listEntries(false, { ...params, after: cursor });
        }
    }

    async selectEntries(entries: TrashBinEntry[]) {
        return await this.repository.selectEntries(entries);
    }

    async sortEntries() {
        return await this.repository.listEntries(true);
    }

    async deleteEntry(id: string) {
        return await this.repository.deleteEntry(id);
    }
}
