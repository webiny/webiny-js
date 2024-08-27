import { GetFolderParams, IGetFolderUseCase } from "./IGetFolderUseCase";
import { ILoadingRepository } from "@webiny/app-utils";
import { LoadingActionsEnum } from "~/types";

export class GetFolderUseCaseWithLoading implements IGetFolderUseCase {
    private loadingRepository: ILoadingRepository;
    private useCase: IGetFolderUseCase;

    constructor(loadingRepository: ILoadingRepository, useCase: IGetFolderUseCase) {
        this.loadingRepository = loadingRepository;
        this.useCase = useCase;
    }

    async execute(params: GetFolderParams) {
        await this.loadingRepository.runCallBack(
            this.useCase.execute(params),
            LoadingActionsEnum.get
        );
    }
}
