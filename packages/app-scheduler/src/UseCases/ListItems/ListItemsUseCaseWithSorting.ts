import { makeAutoObservable } from "mobx";
import type { ISortingRepository } from "@webiny/app-utils";
import { SortingMapper } from "@webiny/app-utils";
import type { IListItemsUseCase } from "./IListItemsUseCase.js";
import type {
    ISchedulerListExecuteParams,
    ISchedulerListExecuteParamsSort
} from "~/Gateways/index.js";

export class ListItemsUseCaseWithSorting implements IListItemsUseCase {
    private sortingRepository: ISortingRepository;
    private useCase: IListItemsUseCase;

    public constructor(sortingRepository: ISortingRepository, useCase: IListItemsUseCase) {
        this.sortingRepository = sortingRepository;
        this.useCase = useCase;
        makeAutoObservable(this);
    }

    public async execute(params: ISchedulerListExecuteParams) {
        const sort = this.sortingRepository.get().map(sort => {
            return SortingMapper.fromDTOtoDb(sort);
        });
        await this.useCase.execute({
            ...params,
            sort: sort as ISchedulerListExecuteParamsSort[]
        });
    }
}
