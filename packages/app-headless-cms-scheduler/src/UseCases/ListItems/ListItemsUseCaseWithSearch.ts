import { makeAutoObservable } from "mobx";
import { ISearchRepository } from "~/Domain";
import { IListItemsUseCase } from "./IListItemsUseCase";
import type { ISchedulerListExecuteParams } from "~/Gateways/index.js";

export class ListItemsUseCaseWithSearch implements IListItemsUseCase {
    private searchRepository: ISearchRepository;
    private useCase: IListItemsUseCase;

    constructor(searchRepository: ISearchRepository, useCase: IListItemsUseCase) {
        this.searchRepository = searchRepository;
        this.useCase = useCase;
        makeAutoObservable(this);
    }

    async execute(params?: Omit<ISchedulerListExecuteParams, "modelId">) {
        const search = this.searchRepository.get();
        await this.useCase.execute({
            ...params,
            where: {
                ...params?.where,
                title_contains: search
            }
        });
    }
}
