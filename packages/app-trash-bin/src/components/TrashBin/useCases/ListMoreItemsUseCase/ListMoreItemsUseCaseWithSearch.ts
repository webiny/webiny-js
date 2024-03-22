import { makeAutoObservable } from "mobx";
import { IListMoreItemsUseCase, ISearchRepository } from "~/components/TrashBin/abstractions";
import { TrashBinListQueryVariables } from "@webiny/app-trash-bin-common/types";

export class ListMoreItemsUseCaseWithSearch implements IListMoreItemsUseCase {
    private searchRepository: ISearchRepository;
    private useCase: IListMoreItemsUseCase;

    constructor(searchRepository: ISearchRepository, useCase: IListMoreItemsUseCase) {
        this.searchRepository = searchRepository;
        this.useCase = useCase;
        makeAutoObservable(this);
    }

    async execute(params?: TrashBinListQueryVariables) {
        const search = this.searchRepository.get();
        await this.useCase.execute({ ...params, search: search || undefined });
    }
}
