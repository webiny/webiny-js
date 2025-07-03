import { ILoadingRepository } from "@webiny/app-utils";
import type { GetPageParams, IGetPageUseCase } from "./IGetPageUseCase.js";
import { loadingActions } from "~/constants.js";

export class GetPageUseCaseWithLoading implements IGetPageUseCase {
    private loadingRepository: ILoadingRepository;
    private useCase: IGetPageUseCase;

    constructor(loadingRepository: ILoadingRepository, useCase: IGetPageUseCase) {
        this.loadingRepository = loadingRepository;
        this.useCase = useCase;
    }

    async execute(params: GetPageParams) {
        await this.loadingRepository.runCallBack(this.useCase.execute(params), loadingActions.get);
    }
}
