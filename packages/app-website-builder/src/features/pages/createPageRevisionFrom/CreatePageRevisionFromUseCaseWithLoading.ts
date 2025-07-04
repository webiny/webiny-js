import { ILoadingRepository } from "@webiny/app-utils";
import {
    ICreatePageRevisionFromUseCase,
    type CreatePageRevisionFromParams
} from "./ICreatePageRevisionFromUseCase.js";
import { loadingActions } from "~/constants.js";

export class CreatePageRevisionFromUseCaseWithLoading implements ICreatePageRevisionFromUseCase {
    private loadingRepository: ILoadingRepository;
    private useCase: ICreatePageRevisionFromUseCase;

    constructor(loadingRepository: ILoadingRepository, useCase: ICreatePageRevisionFromUseCase) {
        this.loadingRepository = loadingRepository;
        this.useCase = useCase;
    }

    async execute(params: CreatePageRevisionFromParams) {
        await this.loadingRepository.runCallBack(
            this.useCase.execute(params),
            loadingActions.createRevisionFrom
        );
    }
}
