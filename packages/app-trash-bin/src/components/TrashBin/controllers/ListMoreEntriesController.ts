import { makeAutoObservable } from "mobx";
import { IMetaRepository, ITrashBinRepository } from "@webiny/app-trash-bin-common";
import { TrashBinListQueryVariables } from "@webiny/app-trash-bin-common/types";
import { IListMoreEntriesController } from "../abstractions";

export class ListMoreEntriesController implements IListMoreEntriesController {
    private repository: ITrashBinRepository;
    private metaRepository: IMetaRepository;

    constructor(repository: ITrashBinRepository, metaRepository: IMetaRepository) {
        this.repository = repository;
        this.metaRepository = metaRepository;
        makeAutoObservable(this);
    }

    async execute(params?: TrashBinListQueryVariables) {
        const { hasMoreItems, cursor } = this.metaRepository.get();

        if (hasMoreItems && cursor) {
            return await this.repository.listEntries(false, { ...params, after: cursor });
        }
    }
}
