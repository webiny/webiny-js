import { ILoadingRepository } from "@webiny/app-utils";
import { type DuplicatePageParams, IDuplicatePageUseCase } from "./IDuplicatePageUseCase.js";
import { loadingActions } from "~/constants.js";

export class DuplicatePageUseCaseWithLoading implements IDuplicatePageUseCase {
    private loadingRepository: ILoadingRepository;
    private useCase: IDuplicatePageUseCase;

    constructor(loadingRepository: ILoadingRepository, useCase: IDuplicatePageUseCase) {
        this.loadingRepository = loadingRepository;
        this.useCase = useCase;
    }

    async execute(params: DuplicatePageParams) {
        await this.loadingRepository.runCallBack(
            this.useCase.execute(params),
            loadingActions.duplicate
        );
    }
}
