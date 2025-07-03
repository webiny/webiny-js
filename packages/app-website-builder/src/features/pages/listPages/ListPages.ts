import { LoadingRepository, loadingRepositoryFactory } from "@webiny/app-utils";
import { IListPagesUseCase } from "./IListPagesUseCase.js";
import { IListPagesGateway } from "./IListPagesGateway.js";
import { ListPagesRepository } from "./ListPagesRepository.js";
import { ListPagesUseCaseWithLoading } from "./ListPagesUseCaseWithLoading.js";
import { ListPagesUseCase } from "./ListPagesUseCase.js";
import { pageCacheFactory, ListCache } from "../cache";
import type { Page } from "~/features/pages/Page.js";

interface IListPagesInstance {
    useCase: IListPagesUseCase;
    pages: ListCache<Page>;
    loading: LoadingRepository;
}

export class ListPages {
    public static getInstance(gateway: IListPagesGateway): IListPagesInstance {
        const pagesCache = pageCacheFactory.getCache();
        const loadingRepository = loadingRepositoryFactory.getRepository("WbPage");
        const repository = new ListPagesRepository(pagesCache, gateway);
        const useCase = new ListPagesUseCase(repository);
        const useCaseWithLoading = new ListPagesUseCaseWithLoading(loadingRepository, useCase);

        return {
            useCase: useCaseWithLoading,
            pages: pagesCache,
            loading: loadingRepository
        };
    }
}
