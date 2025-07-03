import { loadingRepositoryFactory } from "@webiny/app-utils";
import type { IDeletePageGateway } from "~/features/pages/deletePage/IDeletePageGateway.js";
import type { IDeletePageUseCase } from "~/features/pages/deletePage/IDeletePageUseCase.js";
import { pageCacheFactory } from "~/features/pages/cache/index.js";
import { DeletePageRepository } from "~/features/pages/deletePage/DeletePageRepository.js";
import { DeletePageUseCase } from "~/features/pages/deletePage/DeletePageUseCase.js";
import { DeletePageUseCaseWithLoading } from "~/features/pages/deletePage/DeletePageUseCaseWithLoading.js";

export class DeletePage {
    public static getInstance(gateway: IDeletePageGateway): IDeletePageUseCase {
        const pagesCache = pageCacheFactory.getCache();
        const loadingRepository = loadingRepositoryFactory.getRepository("WbPage");
        const repository = new DeletePageRepository(pagesCache, gateway);
        const useCase = new DeletePageUseCase(repository);
        return new DeletePageUseCaseWithLoading(loadingRepository, useCase);
    }
}
