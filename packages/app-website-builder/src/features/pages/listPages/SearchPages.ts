import type { ISearchPagesUseCase } from "~/features/pages/listPages/ISearchPagesUseCase.js";
import { IListPagesGateway } from "~/features/pages/listPages/IListPagesGateway.js";
import { pageCacheFactory } from "~/domains/Page/index.js";
import { loadingRepositoryFactory, metaRepositoryFactory } from "@webiny/app-utils";
import { paramsRepositoryFactory } from "~/domains/Params/index.js";
import { ListPagesRepository } from "~/features/pages/listPages/ListPagesRepository.js";
import { SearchPagesUseCase } from "~/features/pages/listPages/SearchPagesUseCase.js";

interface SearchPagesInstance {
    useCase: ISearchPagesUseCase;
}

export class SearchPages {
    public static getInstance(gateway: IListPagesGateway): SearchPagesInstance {
        const pagesCache = pageCacheFactory.getCache();
        const metaRepository = metaRepositoryFactory.getRepository("WbPage");
        const loadingRepository = loadingRepositoryFactory.getRepository("WbPage");
        const paramsRepository = paramsRepositoryFactory.getRepository("WbPage");

        const repository = new ListPagesRepository(
            pagesCache,
            metaRepository,
            loadingRepository,
            paramsRepository,
            gateway
        );

        const useCase = new SearchPagesUseCase(repository);

        return {
            useCase
        };
    }
}
