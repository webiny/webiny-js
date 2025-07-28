import { loadingRepositoryFactory, metaRepositoryFactory } from "@webiny/app-utils";
import type { IDeleteRedirectGateway } from "~/features/redirects/deleteRedirect/IDeleteRedirectGateway.js";
import type { IDeleteRedirectUseCase } from "~/features/redirects/deleteRedirect/IDeleteRedirectUseCase.js";
import { DeleteRedirectRepository } from "~/features/redirects/deleteRedirect/DeleteRedirectRepository.js";
import { DeleteRedirectUseCase } from "~/features/redirects/deleteRedirect/DeleteRedirectUseCase.js";
import { DeleteRedirectUseCaseWithLoading } from "~/features/redirects/deleteRedirect/DeleteRedirectUseCaseWithLoading.js";
import { redirectListCache } from "~/domain/Redirect/index.js";

export class DeleteRedirect {
    public static getInstance(gateway: IDeleteRedirectGateway): IDeleteRedirectUseCase {
        const loadingRepository = loadingRepositoryFactory.getRepository("WbRedirect");
        const metaRepository = metaRepositoryFactory.getRepository("WbRedirect");
        const repository = new DeleteRedirectRepository(redirectListCache, metaRepository, gateway);
        const useCase = new DeleteRedirectUseCase(repository);
        return new DeleteRedirectUseCaseWithLoading(loadingRepository, useCase);
    }
}
