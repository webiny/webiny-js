import { loadingRepositoryFactory } from "@webiny/app-utils";
import { ICreateRedirectUseCase } from "./ICreateRedirectUseCase.js";
import { ICreateRedirectGateway } from "./ICreateRedirectGateway.js";
import { CreateRedirectRepository } from "./CreateRedirectRepository.js";
import { CreateRedirectUseCase } from "./CreateRedirectUseCase.js";
import { CreateRedirectUseCaseWithLoading } from "./CreateRedirectUseCaseWithLoading.js";
import { redirectListCache } from "~/domain/Redirect/index.js";

export class CreateRedirect {
    public static getInstance(gateway: ICreateRedirectGateway): ICreateRedirectUseCase {
        const loadingRepository = loadingRepositoryFactory.getRepository("WbRedirect");
        const repository = new CreateRedirectRepository(redirectListCache, gateway);
        const useCase = new CreateRedirectUseCase(repository);
        return new CreateRedirectUseCaseWithLoading(loadingRepository, useCase);
    }
}
