import { ILoadingRepository } from "@webiny/app-utils";
import type {
    GetPageRevisionsParams,
    IGetPageRevisionsUseCase
} from "./IGetPageRevisionsUseCase.js";
import { loadingActions } from "~/constants.js";

export class GetPageRevisionsUseCaseWithLoading implements IGetPageRevisionsUseCase {
    private loadingRepository: ILoadingRepository;
    private useCase: IGetPageRevisionsUseCase;

    constructor(loadingRepository: ILoadingRepository, useCase: IGetPageRevisionsUseCase) {
        this.loadingRepository = loadingRepository;
        this.useCase = useCase;
    }

    async execute(params: GetPageRevisionsParams) {
        return await this.loadingRepository.runCallBack(
            this.useCase.execute(params),
            loadingActions.get
        );
    }
}
