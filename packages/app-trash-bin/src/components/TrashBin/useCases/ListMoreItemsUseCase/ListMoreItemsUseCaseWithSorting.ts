import { makeAutoObservable } from "mobx";
import { IListMoreItemsUseCase } from "~/components/TrashBin/abstractions";
import { TrashBinListQueryVariables } from "@webiny/app-trash-bin-common/types";
import { ISortingRepository, SortingMapper } from "@webiny/app-utils";

export class ListMoreItemsUseCaseWithSorting implements IListMoreItemsUseCase {
    private sortingRepository: ISortingRepository;
    private useCase: IListMoreItemsUseCase;

    constructor(sortingRepository: ISortingRepository, useCase: IListMoreItemsUseCase) {
        this.sortingRepository = sortingRepository;
        this.useCase = useCase;
        makeAutoObservable(this);
    }

    async execute(params?: TrashBinListQueryVariables) {
        const sort = this.sortingRepository.get().map(sort => SortingMapper.fromDTOtoDb(sort));
        await this.useCase.execute({ ...params, sort });
    }
}
