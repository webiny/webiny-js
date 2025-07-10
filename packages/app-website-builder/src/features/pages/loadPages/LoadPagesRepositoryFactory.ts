import {
    loadingRepositoryFactory,
    metaRepositoryFactory,
    Sorting,
    sortRepositoryFactory
} from "@webiny/app-utils";
import { pageCacheFactory } from "~/domain/Page/index.js";
import { paramsRepositoryFactory } from "~/domain/Params/index.js";
import { searchRepositoryFactory } from "~/domain/Search/index.js";
import type { IListPagesGateway } from "~/features/pages/loadPages/IListPagesGateway.js";
import { LoadPagesRepository } from "~/features/pages/loadPages/LoadPagesRepository.js";
import type { ILoadPagesRepository } from "~/features/pages/loadPages/ILoadPagesRepository.js";
import { QueryStringSearchStateGateway } from "~/features/pages/loadPages/QueryStringSearchStateGateway.js";
import { SearchRepositoryWithQueryStringGateway } from "~/features/pages/loadPages/SearchRepositoryWithQueryStringGateway.js";
import { SortingRepositoryWithDefaults } from "~/domain/Sorting/index.js";

export class LoadPagesRepositoryFactory {
    getRepository(gateway: IListPagesGateway, sorting?: Sorting[]): ILoadPagesRepository {
        const namespace = "WbPage";

        const pagesCache = pageCacheFactory.getCache();
        const loadingRepository = loadingRepositoryFactory.getRepository(namespace);
        const metaRepository = metaRepositoryFactory.getRepository(namespace);
        const paramsRepository = paramsRepositoryFactory.getRepository(namespace);

        let sortingRepository = sortRepositoryFactory.getRepository(namespace);

        if (sorting) {
            sortingRepository = new SortingRepositoryWithDefaults(sorting, sortingRepository);
        }

        const searchRepository = searchRepositoryFactory.getRepository(namespace);
        const searchQueryStringGateway = new QueryStringSearchStateGateway();
        const searchRepositoryWithQueryString = new SearchRepositoryWithQueryStringGateway(
            searchQueryStringGateway,
            searchRepository
        );

        return new LoadPagesRepository(
            pagesCache,
            loadingRepository,
            metaRepository,
            paramsRepository,
            searchRepositoryWithQueryString,
            sortingRepository,
            gateway
        );
    }
}

export const loadPagesRepositoryFactory = new LoadPagesRepositoryFactory();
