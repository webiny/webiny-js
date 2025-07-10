import { loadingRepositoryFactory } from "@webiny/app-utils";
import type { IPublishPageGateway } from "~/features/pages/publishPage/IPublishPageGateway.js";
import type { IPublishPageUseCase } from "~/features/pages/publishPage/IPublishPageUseCase.js";
import { PublishPageRepository } from "~/features/pages/publishPage/PublishPageRepository.js";
import { PublishPageUseCase } from "~/features/pages/publishPage/PublishPageUseCase.js";
import { PublishPageUseCaseWithLoading } from "~/features/pages/publishPage/PublishPageUseCaseWithLoading.js";
import { pageCacheFactory } from "~/domain/Page/index.js";

export class PublishPage {
    public static getInstance(gateway: IPublishPageGateway): IPublishPageUseCase {
        const pagesCache = pageCacheFactory.getCache();
        const loadingRepository = loadingRepositoryFactory.getRepository("WbPage");
        const repository = new PublishPageRepository(pagesCache, gateway);
        const useCase = new PublishPageUseCase(repository);
        return new PublishPageUseCaseWithLoading(loadingRepository, useCase);
    }
}
