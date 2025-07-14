import {
    loadingRepositoryFactory,
    metaRepositoryFactory,
    sortRepositoryFactory
} from "@webiny/app-utils";
import { pageCacheFactory } from "~/domain/Page/index.js";
import { paramsRepositoryFactory } from "~/domain/Params/index.js";
import { searchRepositoryFactory } from "~/domain/Search/index.js";
import type { IListPagesGateway } from "~/features/pages/loadPages/IListPagesGateway.js";
import { ListPagesRepository } from "~/features/pages/loadPages/ListPagesRepository.js";
import type { IListPagesRepository } from "~/features/pages/loadPages/IListPagesRepository.js";
import { QueryStringSearchStateGateway } from "~/features/pages/loadPages/QueryStringSearchStateGateway.js";
import { SearchRepositoryWithQueryStringGateway } from "~/features/pages/loadPages/SearchRepositoryWithQueryStringGateway.js";
import { filterRepositoryFactory } from "~/domain/Filter/index.js";

export class ListPagesRepositoryFactory {
    getRepository(gateway: IListPagesGateway): IListPagesRepository {
        const namespace = "WbPage";

        const pagesCache = pageCacheFactory.getCache();
        const loadingRepository = loadingRepositoryFactory.getRepository(namespace);
        const metaRepository = metaRepositoryFactory.getRepository(namespace);
        const paramsRepository = paramsRepositoryFactory.getRepository(namespace);
        const sortingRepository = sortRepositoryFactory.getRepository(namespace);
        const filterRepository = filterRepositoryFactory.getRepository(namespace);

        const searchRepository = searchRepositoryFactory.getRepository(namespace);
        const searchQueryStringGateway = new QueryStringSearchStateGateway();
        const searchRepositoryWithQueryString = new SearchRepositoryWithQueryStringGateway(
            searchQueryStringGateway,
            searchRepository
        );

        return new ListPagesRepository(
            pagesCache,
            loadingRepository,
            metaRepository,
            paramsRepository,
            searchRepositoryWithQueryString,
            sortingRepository,
            filterRepository,
            gateway
        );
    }
}

export const listPagesRepositoryFactory = new ListPagesRepositoryFactory();
