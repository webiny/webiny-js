import { loadingRepositoryFactory } from "@webiny/app-utils";
import type { IMoveRedirectGateway } from "~/features/redirects/moveRedirect/IMoveRedirectGateway.js";
import type { IMoveRedirectUseCase } from "~/features/redirects/moveRedirect/IMoveRedirectUseCase.js";
import { MoveRedirectRepository } from "~/features/redirects/moveRedirect/MoveRedirectRepository.js";
import { MoveRedirectUseCase } from "~/features/redirects/moveRedirect/MoveRedirectUseCase.js";
import { MoveRedirectUseCaseWithLoading } from "~/features/redirects/moveRedirect/MoveRedirectUseCaseWithLoading.js";
import { redirectListCache } from "~/domain/Redirect/index.js";

export class MoveRedirect {
    public static getInstance(gateway: IMoveRedirectGateway): IMoveRedirectUseCase {
        const loadingRepository = loadingRepositoryFactory.getRepository("WbRedirect");
        const repository = new MoveRedirectRepository(redirectListCache, gateway);
        const useCase = new MoveRedirectUseCase(repository);
        return new MoveRedirectUseCaseWithLoading(loadingRepository, useCase);
    }
}
