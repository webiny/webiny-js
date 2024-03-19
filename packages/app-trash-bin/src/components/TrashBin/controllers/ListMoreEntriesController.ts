import { makeAutoObservable } from "mobx";
import { ITrashBinRepository } from "@webiny/app-trash-bin-common";
import { TrashBinListQueryVariables } from "@webiny/app-trash-bin-common/types";
import { IListMoreEntriesController } from "../abstractions";

export class ListMoreEntriesController implements IListMoreEntriesController {
    private repository: ITrashBinRepository;

    constructor(repository: ITrashBinRepository) {
        this.repository = repository;
        makeAutoObservable(this);
    }

    async execute(params?: TrashBinListQueryVariables) {
        const { hasMoreItems, cursor } = this.repository.getMeta();

        if (hasMoreItems && cursor) {
            return await this.repository.listEntries(false, { ...params, after: cursor });
        }
    }
}
