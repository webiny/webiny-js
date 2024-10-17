import { ILoadingRepository } from "@webiny/app-utils";
import { LoadingActionsEnum } from "~/types";
import { IListFoldersUseCase, ListFoldersParams } from "./IListFoldersUseCase";

export class ListFoldersUseCaseWithLoading implements IListFoldersUseCase {
    private loadingRepository: ILoadingRepository;
    private useCase: IListFoldersUseCase;

    constructor(loadingRepository: ILoadingRepository, useCase: IListFoldersUseCase) {
        this.loadingRepository = loadingRepository;
        this.useCase = useCase;
    }

    async execute(params: ListFoldersParams) {
        await this.loadingRepository.runCallBack(
            this.useCase.execute(params),
            LoadingActionsEnum.list
        );
    }
}
