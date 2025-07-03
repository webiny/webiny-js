import { loadingRepositoryFactory } from "@webiny/app-utils";
import type { IGetPageUseCase } from "~/features/pages/getPage/IGetPageUseCase.js";
import type { IGetPageGateway } from "~/features/pages/getPage/IGetPageGateway.js";
import { pageCacheFactory } from "~/features/pages/cache/index.js";
import { GetPageRepository } from "~/features/pages/getPage/GetPageRepository.js";
import { GetPageUseCase } from "~/features/pages/getPage/GetPageUseCase.js";
import { GetPageUseCaseWithLoading } from "~/features/pages/getPage/GetPageUseCaseWithLoading.js";

export class GetPage {
    public static getInstance(gateway: IGetPageGateway): IGetPageUseCase {
        const pagesCache = pageCacheFactory.getCache();
        const loadingRepository = loadingRepositoryFactory.getRepository("WbPage");
        const repository = new GetPageRepository(pagesCache, gateway);
        const useCase = new GetPageUseCase(repository);
        return new GetPageUseCaseWithLoading(loadingRepository, useCase);
    }
}
