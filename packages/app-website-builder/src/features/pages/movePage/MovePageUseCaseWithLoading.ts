import { ILoadingRepository } from "@webiny/app-utils";
import { IMovePageUseCase, type MovePageParams } from "./IMovePageUseCase.js";
import { loadingActions } from "~/constants.js";

export class MovePageUseCaseWithLoading implements IMovePageUseCase {
    private loadingRepository: ILoadingRepository;
    private useCase: IMovePageUseCase;

    constructor(loadingRepository: ILoadingRepository, useCase: IMovePageUseCase) {
        this.loadingRepository = loadingRepository;
        this.useCase = useCase;
    }

    async execute(params: MovePageParams) {
        await this.loadingRepository.runCallBack(this.useCase.execute(params), loadingActions.move);
    }
}
