import { makeAutoObservable } from "mobx";
import { IMetaRepository } from "@webiny/app-utils";
import { TrashBinListQueryVariables } from "@webiny/app-trash-bin-common/types";
import { IListMoreItemsUseCase, ITrashBinItemsRepository } from "../../abstractions";

export class ListMoreItemsUseCase implements IListMoreItemsUseCase {
    private itemsRepository: ITrashBinItemsRepository;
    private metaRepository: IMetaRepository;

    constructor(itemsRepository: ITrashBinItemsRepository, metaRepository: IMetaRepository) {
        this.itemsRepository = itemsRepository;
        this.metaRepository = metaRepository;
        makeAutoObservable(this);
    }

    async execute(params?: TrashBinListQueryVariables) {
        const { hasMoreItems, cursor } = this.metaRepository.get();

        if (hasMoreItems && cursor) {
            await this.itemsRepository.listItems({ ...params, after: cursor });
        }
    }
}
