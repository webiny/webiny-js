import { makeAutoObservable } from "mobx";
import type { ISortingRepository } from "@webiny/app-utils";
import { SortingMapper } from "@webiny/app-utils";
import type { IListItemsUseCase } from "./IListItemsUseCase.js";
import type {
    IListScheduleActionsExecuteParams,
    IListScheduleActionsExecuteParamsSort
} from "~/Gateways/index.js";

export class ListItemsUseCaseWithSorting implements IListItemsUseCase {
    private sortingRepository: ISortingRepository;
    private useCase: IListItemsUseCase;

    public constructor(sortingRepository: ISortingRepository, useCase: IListItemsUseCase) {
        this.sortingRepository = sortingRepository;
        this.useCase = useCase;
        makeAutoObservable(this);
    }

    public async execute(params?: Omit<IListScheduleActionsExecuteParams, "app">) {
        const sort = this.sortingRepository.get().map(sort => {
            return SortingMapper.fromDTOtoDb(sort);
        });
        await this.useCase.execute({
            where: params?.where,
            limit: params?.limit,
            after: params?.after,
            sort: sort as IListScheduleActionsExecuteParamsSort[]
        });
    }
}
