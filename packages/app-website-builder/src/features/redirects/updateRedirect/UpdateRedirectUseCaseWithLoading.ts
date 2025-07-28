import { ILoadingRepository } from "@webiny/app-utils";
import { IUpdateRedirectUseCase, type UpdateRedirectParams } from "./IUpdateRedirectUseCase.js";
import { loadingActions } from "~/constants.js";

export class UpdateRedirectUseCaseWithLoading implements IUpdateRedirectUseCase {
    private loadingRepository: ILoadingRepository;
    private useCase: IUpdateRedirectUseCase;

    constructor(loadingRepository: ILoadingRepository, useCase: IUpdateRedirectUseCase) {
        this.loadingRepository = loadingRepository;
        this.useCase = useCase;
    }

    async execute(params: UpdateRedirectParams) {
        await this.loadingRepository.runCallBack(
            this.useCase.execute(params),
            loadingActions.update
        );
    }
}
