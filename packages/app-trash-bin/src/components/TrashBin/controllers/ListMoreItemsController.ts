import { makeAutoObservable } from "mobx";
import { IMetaRepository } from "@webiny/app-utilities";
import { TrashBinListQueryVariables } from "@webiny/app-trash-bin-common/types";
import { IListMoreItemsController, ITrashBinItemsRepository } from "../abstractions";

export class ListMoreItemsController implements IListMoreItemsController {
    private repository: ITrashBinItemsRepository;
    private metaRepository: IMetaRepository;

    constructor(repository: ITrashBinItemsRepository, metaRepository: IMetaRepository) {
        this.repository = repository;
        this.metaRepository = metaRepository;
        makeAutoObservable(this);
    }

    async execute(params?: TrashBinListQueryVariables) {
        const { hasMoreItems, cursor } = this.metaRepository.get();

        if (hasMoreItems && cursor) {
            return await this.repository.listItems(false, { ...params, after: cursor });
        }
    }
}
