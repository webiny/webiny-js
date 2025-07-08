import { loadingRepositoryFactory } from "@webiny/app-utils";
import type { IUnpublishPageUseCase } from "~/features/pages/unpublishPage/IUnpublishPageUseCase.js";
import type { IUnpublishPageGateway } from "~/features/pages/unpublishPage/IUnpublishPageGateway.js";
import { UnpublishPageRepository } from "~/features/pages/unpublishPage/UnpublishPageRepository.js";
import { UnpublishPageUseCase } from "~/features/pages/unpublishPage/UnpublishPageUseCase.js";
import { UnpublishPageUseCaseWithLoading } from "~/features/pages/unpublishPage/UnpublishPageUseCaseWithLoading.js";
import { pageCacheFactory } from "~/domains/Page/index.js";

export class UnpublishPage {
    public static getInstance(gateway: IUnpublishPageGateway): IUnpublishPageUseCase {
        const pagesCache = pageCacheFactory.getCache();
        const loadingRepository = loadingRepositoryFactory.getRepository("WbPage");
        const repository = new UnpublishPageRepository(pagesCache, gateway);
        const useCase = new UnpublishPageUseCase(repository);
        return new UnpublishPageUseCaseWithLoading(loadingRepository, useCase);
    }
}
