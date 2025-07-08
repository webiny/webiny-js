import { loadingRepositoryFactory } from "@webiny/app-utils";
import type { IMovePageGateway } from "~/features/pages/movePage/IMovePageGateway.js";
import type { IMovePageUseCase } from "~/features/pages/movePage/IMovePageUseCase.js";
import { MovePageRepository } from "~/features/pages/movePage/MovePageRepository.js";
import { MovePageUseCase } from "~/features/pages/movePage/MovePageUseCase.js";
import { MovePageUseCaseWithLoading } from "~/features/pages/movePage/MovePageUseCaseWithLoading.js";
import { pageCacheFactory } from "~/domains/Page/index.js";

export class MovePage {
    public static getInstance(gateway: IMovePageGateway): IMovePageUseCase {
        const pagesCache = pageCacheFactory.getCache();
        const loadingRepository = loadingRepositoryFactory.getRepository("WbPage");
        const repository = new MovePageRepository(pagesCache, gateway);
        const useCase = new MovePageUseCase(repository);
        return new MovePageUseCaseWithLoading(loadingRepository, useCase);
    }
}
