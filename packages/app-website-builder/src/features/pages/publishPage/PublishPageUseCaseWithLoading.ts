import { ILoadingRepository } from "@webiny/app-utils";
import { IPublishPageUseCase, type PublishPageParams } from "./IPublishPageUseCase.js";
import { loadingActions } from "~/constants.js";

export class PublishPageUseCaseWithLoading implements IPublishPageUseCase {
    private loadingRepository: ILoadingRepository;
    private useCase: IPublishPageUseCase;

    constructor(loadingRepository: ILoadingRepository, useCase: IPublishPageUseCase) {
        this.loadingRepository = loadingRepository;
        this.useCase = useCase;
    }

    async execute(params: PublishPageParams) {
        await this.loadingRepository.runCallBack(
            this.useCase.execute(params),
            loadingActions.publish
        );
    }
}
