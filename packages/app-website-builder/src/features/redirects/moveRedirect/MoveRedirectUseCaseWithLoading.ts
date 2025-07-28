import { ILoadingRepository } from "@webiny/app-utils";
import { IMoveRedirectUseCase, type MoveRedirectParams } from "./IMoveRedirectUseCase.js";
import { loadingActions } from "~/constants.js";

export class MoveRedirectUseCaseWithLoading implements IMoveRedirectUseCase {
    private loadingRepository: ILoadingRepository;
    private useCase: IMoveRedirectUseCase;

    constructor(loadingRepository: ILoadingRepository, useCase: IMoveRedirectUseCase) {
        this.loadingRepository = loadingRepository;
        this.useCase = useCase;
    }

    async execute(params: MoveRedirectParams) {
        await this.loadingRepository.runCallBack(this.useCase.execute(params), loadingActions.move);
    }
}
