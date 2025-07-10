import { loadingRepositoryFactory } from "@webiny/app-utils";
import type { IUpdatePageGateway } from "~/features/pages/updatePage/IUpdatePageGateway.js";
import type { IUpdatePageUseCase } from "~/features/pages/updatePage/IUpdatePageUseCase.js";
import { UpdatePageRepository } from "~/features/pages/updatePage/UpdatePageRepository.js";
import { UpdatePageUseCase } from "~/features/pages/updatePage/UpdatePageUseCase.js";
import { UpdatePageUseCaseWithLoading } from "~/features/pages/updatePage/UpdatePageUseCaseWithLoading.js";
import { pageCacheFactory } from "~/domain/Page/index.js";

export class UpdatePage {
    public static getInstance(gateway: IUpdatePageGateway): IUpdatePageUseCase {
        const pagesCache = pageCacheFactory.getCache();
        const loadingRepository = loadingRepositoryFactory.getRepository("WbPage");
        const repository = new UpdatePageRepository(pagesCache, gateway);
        const useCase = new UpdatePageUseCase(repository);
        return new UpdatePageUseCaseWithLoading(loadingRepository, useCase);
    }
}
