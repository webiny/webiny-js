import { LoadingRepository, loadingRepositoryFactory } from "@webiny/app-utils";
import type { IGetPageUseCase } from "~/features/pages/getPage/IGetPageUseCase.js";
import type { IGetPageGateway } from "~/features/pages/getPage/IGetPageGateway.js";
import { GetPageRepository } from "~/features/pages/getPage/GetPageRepository.js";
import { GetPageUseCase } from "~/features/pages/getPage/GetPageUseCase.js";
import { GetPageUseCaseWithLoading } from "~/features/pages/getPage/GetPageUseCaseWithLoading.js";
import { pageCacheFactory } from "~/domain/Page/index.js";

interface IGetPageInstance {
    useCase: IGetPageUseCase;
    loading: LoadingRepository;
}

export class GetPage {
    public static getInstance(gateway: IGetPageGateway): IGetPageInstance {
        const pagesCache = pageCacheFactory.getCache();
        const loadingRepository = loadingRepositoryFactory.getRepository("WbPage");
        const repository = new GetPageRepository(pagesCache, gateway);
        const useCase = new GetPageUseCase(repository);
        const useCaseWithLoading = new GetPageUseCaseWithLoading(loadingRepository, useCase);

        return {
            useCase: useCaseWithLoading,
            loading: loadingRepository
        };
    }
}
