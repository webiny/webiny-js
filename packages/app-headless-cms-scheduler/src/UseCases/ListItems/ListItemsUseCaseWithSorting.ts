import { makeAutoObservable } from "mobx";
import { ISortingRepository, SortingMapper } from "@webiny/app-utils";
import { IListItemsUseCase } from "./IListItemsUseCase";
import type {
    ISchedulerListExecuteParams,
    ISchedulerListExecuteParamsSort
} from "~/Gateways/index.js";

export class ListItemsUseCaseWithSorting implements IListItemsUseCase {
    private sortingRepository: ISortingRepository;
    private useCase: IListItemsUseCase;

    constructor(sortingRepository: ISortingRepository, useCase: IListItemsUseCase) {
        this.sortingRepository = sortingRepository;
        this.useCase = useCase;
        makeAutoObservable(this);
    }

    async execute(params?: Omit<ISchedulerListExecuteParams, "modelId">) {
        const sort = this.sortingRepository.get().map(sort => SortingMapper.fromDTOtoDb(sort));
        await this.useCase.execute({
            ...params,
            sort: sort as ISchedulerListExecuteParamsSort[]
        });
    }
}
