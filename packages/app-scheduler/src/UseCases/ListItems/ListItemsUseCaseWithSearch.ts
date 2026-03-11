import { makeAutoObservable } from "mobx";
import type { ISearchRepository } from "~/Domain/index.js";
import type { IListItemsUseCase } from "./IListItemsUseCase.js";
import type { IListScheduleActionsExecuteParams } from "~/Gateways/index.js";

export class ListItemsUseCaseWithSearch implements IListItemsUseCase {
    private searchRepository: ISearchRepository;
    private useCase: IListItemsUseCase;

    constructor(searchRepository: ISearchRepository, useCase: IListItemsUseCase) {
        this.searchRepository = searchRepository;
        this.useCase = useCase;
        makeAutoObservable(this);
    }

    async execute(params?: Omit<IListScheduleActionsExecuteParams, "app">) {
        const search = this.searchRepository.get();
        await this.useCase.execute({
            sort: params?.sort,
            limit: params?.limit,
            after: params?.after,
            where: {
                ...params?.where,
                title_contains: search.length > 0 ? search : undefined
            }
        });
    }
}
