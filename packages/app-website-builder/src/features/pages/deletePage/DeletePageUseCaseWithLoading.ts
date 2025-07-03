import { ILoadingRepository } from "@webiny/app-utils";
import { type DeletePageParams, IDeletePageUseCase } from "./IDeletePageUseCase.js";
import { loadingActions } from "~/constants.js";

export class DeletePageUseCaseWithLoading implements IDeletePageUseCase {
    private loadingRepository: ILoadingRepository;
    private useCase: IDeletePageUseCase;

    constructor(loadingRepository: ILoadingRepository, useCase: IDeletePageUseCase) {
        this.loadingRepository = loadingRepository;
        this.useCase = useCase;
    }

    async execute(params: DeletePageParams) {
        await this.loadingRepository.runCallBack(
            this.useCase.execute(params),
            loadingActions.delete
        );
    }
}
