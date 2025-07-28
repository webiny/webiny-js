import { loadingRepositoryFactory } from "@webiny/app-utils";
import type { IUpdateRedirectGateway } from "~/features/redirects/updateRedirect/IUpdateRedirectGateway.js";
import type { IUpdateRedirectUseCase } from "~/features/redirects/updateRedirect/IUpdateRedirectUseCase.js";
import { UpdateRedirectRepository } from "~/features/redirects/updateRedirect/UpdateRedirectRepository.js";
import { UpdateRedirectUseCase } from "~/features/redirects/updateRedirect/UpdateRedirectUseCase.js";
import { UpdateRedirectUseCaseWithLoading } from "~/features/redirects/updateRedirect/UpdateRedirectUseCaseWithLoading.js";
import { redirectListCache } from "~/domain/Redirect/index.js";

export class UpdateRedirect {
    public static getInstance(gateway: IUpdateRedirectGateway): IUpdateRedirectUseCase {
        const loadingRepository = loadingRepositoryFactory.getRepository("WbRedirect");
        const repository = new UpdateRedirectRepository(redirectListCache, gateway);
        const useCase = new UpdateRedirectUseCase(repository);
        return new UpdateRedirectUseCaseWithLoading(loadingRepository, useCase);
    }
}
