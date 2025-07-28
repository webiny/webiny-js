import { ILoadingRepository } from "@webiny/app-utils";
import { CreateRedirectParams, ICreateRedirectUseCase } from "./ICreateRedirectUseCase.js";
import { loadingActions } from "~/constants.js";

export class CreateRedirectUseCaseWithLoading implements ICreateRedirectUseCase {
    private loadingRepository: ILoadingRepository;
    private useCase: ICreateRedirectUseCase;

    constructor(loadingRepository: ILoadingRepository, useCase: ICreateRedirectUseCase) {
        this.loadingRepository = loadingRepository;
        this.useCase = useCase;
    }

    async execute(params: CreateRedirectParams) {
        return await this.loadingRepository.runCallBack(
            this.useCase.execute(params),
            loadingActions.create
        );
    }
}
