import { makeAutoObservable } from "mobx";
import { IListItemsUseCase } from "./IListItemsUseCase";
import { TrashBinListQueryVariables } from "@webiny/app-trash-bin-common/types";
import { ISortingRepository, SortingMapper } from "@webiny/app-utils";

export class ListItemsUseCaseWithSorting implements IListItemsUseCase {
    private sortingRepository: ISortingRepository;
    private useCase: IListItemsUseCase;

    constructor(sortingRepository: ISortingRepository, useCase: IListItemsUseCase) {
        this.sortingRepository = sortingRepository;
        this.useCase = useCase;
        makeAutoObservable(this);
    }

    async execute(params?: TrashBinListQueryVariables) {
        const sort = this.sortingRepository.get().map(sort => SortingMapper.fromDTOtoDb(sort));
        await this.useCase.execute({ ...params, sort });
    }
}
