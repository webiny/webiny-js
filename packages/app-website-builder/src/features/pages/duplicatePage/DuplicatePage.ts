import { loadingRepositoryFactory } from "@webiny/app-utils";
import type { IDuplicatePageGateway } from "~/features/pages/duplicatePage/IDuplicatePageGateway.js";
import type { IDuplicatePageUseCase } from "~/features/pages/duplicatePage/IDuplicatePageUseCase.js";
import { pageCacheFactory } from "~/features/pages/cache/index.js";
import { DuplicatePageRepository } from "~/features/pages/duplicatePage/DuplicatePageRepository.js";
import { DuplicatePageUseCase } from "~/features/pages/duplicatePage/DuplicatePageUseCase.js";
import { DuplicatePageUseCaseWithLoading } from "~/features/pages/duplicatePage/DuplicatePageUseCaseWithLoading.js";

export class DuplicatePage {
    public static getInstance(gateway: IDuplicatePageGateway): IDuplicatePageUseCase {
        const pagesCache = pageCacheFactory.getCache();
        const loadingRepository = loadingRepositoryFactory.getRepository("WbPage");
        const repository = new DuplicatePageRepository(pagesCache, gateway);
        const useCase = new DuplicatePageUseCase(repository);
        return new DuplicatePageUseCaseWithLoading(loadingRepository, useCase);
    }
}
