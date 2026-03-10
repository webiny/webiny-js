import { makeAutoObservable } from "mobx";
import type { ISortingRepository } from "@webiny/app-utils";
import { SortingMapper } from "@webiny/app-utils";
import type { IListItemsUseCase } from "./IListItemsUseCase.js";
import type {
    IWbSchedulerListExecuteParams,
    IWbSchedulerListExecuteParamsSort
} from "~/Gateways/index.js";

export class ListItemsUseCaseWithSorting implements IListItemsUseCase {
    private sortingRepository: ISortingRepository;
    private useCase: IListItemsUseCase;

    constructor(sortingRepository: ISortingRepository, useCase: IListItemsUseCase) {
        this.sortingRepository = sortingRepository;
        this.useCase = useCase;
        makeAutoObservable(this);
    }

    async execute(params?: Omit<IWbSchedulerListExecuteParams, "modelId">) {
        const sort = this.sortingRepository.get().map(sort => SortingMapper.fromDTOtoDb(sort));
        await this.useCase.execute({
            ...params,
            sort: sort as IWbSchedulerListExecuteParamsSort[]
        });
    }
}
