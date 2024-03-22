import { makeAutoObservable } from "mobx";
import { IListItemsUseCase, ITrashBinItemsRepository } from "~/components/TrashBin/abstractions";
import { TrashBinListQueryVariables } from "@webiny/app-trash-bin-common/types";

export class ListItemsUseCase implements IListItemsUseCase {
    private itemsRepository: ITrashBinItemsRepository;
    constructor(itemsRepository: ITrashBinItemsRepository) {
        this.itemsRepository = itemsRepository;
        makeAutoObservable(this);
    }

    async execute(params?: TrashBinListQueryVariables) {
        await this.itemsRepository.listItems({ ...params });
    }
}
