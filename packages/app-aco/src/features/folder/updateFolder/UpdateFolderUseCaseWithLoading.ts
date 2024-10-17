import { ILoadingRepository } from "@webiny/app-utils";
import { LoadingActionsEnum } from "~/types";
import { IUpdateFolderUseCase, UpdateFolderParams } from "./IUpdateFolderUseCase";

export class UpdateFolderUseCaseWithLoading implements IUpdateFolderUseCase {
    private loadingRepository: ILoadingRepository;
    private useCase: IUpdateFolderUseCase;

    constructor(loadingRepository: ILoadingRepository, useCase: IUpdateFolderUseCase) {
        this.loadingRepository = loadingRepository;
        this.useCase = useCase;
    }

    async execute(params: UpdateFolderParams) {
        await this.loadingRepository.runCallBack(
            this.useCase.execute(params),
            LoadingActionsEnum.update
        );
    }
}
