import type { LoadingRepository } from "@webiny/app-utils";
import { loadingRepositoryFactory } from "@webiny/app-utils";
import type { IGetPageUseCase } from "~/features/pages/getPage/IGetPageUseCase.js";
import type { IGetPageGateway } from "~/features/pages/getPage/IGetPageGateway.js";
import { GetPageRepository } from "~/features/pages/getPage/GetPageRepository.js";
import { GetPageUseCase } from "~/features/pages/getPage/GetPageUseCase.js";
import { GetPageUseCaseWithLoading } from "~/features/pages/getPage/GetPageUseCaseWithLoading.js";
import { fullPageCache } from "~/domain/Page/index.js";

export interface IGetPageInstance {
    useCase: IGetPageUseCase;
    loading: LoadingRepository;
}

export class GetPage {
    public static getInstance(gateway: IGetPageGateway): IGetPageInstance {
        const loadingRepository = loadingRepositoryFactory.getRepository("WbPage");
        const repository = new GetPageRepository(fullPageCache, gateway);
        const useCase = new GetPageUseCase(repository);
        const useCaseWithLoading = new GetPageUseCaseWithLoading(loadingRepository, useCase);

        return {
            useCase: useCaseWithLoading,
            loading: loadingRepository
        };
    }
}
