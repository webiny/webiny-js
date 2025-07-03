import { ILoadingRepository } from "@webiny/app-utils";
import { IListPagesUseCase, type ListPagesUseCaseParams } from "./IListPagesUseCase.js";
import { loadingActions } from "~/constants.js";

export class ListPagesUseCaseWithLoading implements IListPagesUseCase {
    private loadingRepository: ILoadingRepository;
    private useCase: IListPagesUseCase;

    constructor(loadingRepository: ILoadingRepository, useCase: IListPagesUseCase) {
        this.loadingRepository = loadingRepository;
        this.useCase = useCase;
    }

    async execute(params: ListPagesUseCaseParams) {
        await this.loadingRepository.runCallBack(this.useCase.execute(params), loadingActions.list);
    }
}
