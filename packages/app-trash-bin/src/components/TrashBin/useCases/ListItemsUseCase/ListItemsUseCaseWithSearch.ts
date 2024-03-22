import { makeAutoObservable } from "mobx";
import { IListItemsUseCase, ISearchRepository } from "~/components/TrashBin/abstractions";
import { TrashBinListQueryVariables } from "@webiny/app-trash-bin-common/types";

export class ListItemsUseCaseWithSearch implements IListItemsUseCase {
    private searchRepository: ISearchRepository;
    private useCase: IListItemsUseCase;

    constructor(searchRepository: ISearchRepository, useCase: IListItemsUseCase) {
        this.searchRepository = searchRepository;
        this.useCase = useCase;
        makeAutoObservable(this);
    }

    async execute(params?: TrashBinListQueryVariables) {
        const search = this.searchRepository.get();
        await this.useCase.execute({ ...params, search: search || undefined });
    }
}
