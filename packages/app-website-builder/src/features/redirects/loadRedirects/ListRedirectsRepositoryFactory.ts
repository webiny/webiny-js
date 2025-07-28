import {
    loadingRepositoryFactory,
    metaRepositoryFactory,
    sortRepositoryFactory
} from "@webiny/app-utils";
import { redirectListCache } from "~/domain/Redirect/index.js";
import { paramsRepositoryFactory } from "~/domain/Params/index.js";
import { searchRepositoryFactory } from "~/domain/Search/index.js";
import type { IListRedirectsGateway } from "~/features/redirects/loadRedirects/IListRedirectsGateway.js";
import { ListRedirectsRepository } from "~/features/redirects/loadRedirects/ListRedirectsRepository.js";
import type { IListRedirectsRepository } from "~/features/redirects/loadRedirects/IListRedirectsRepository.js";
import { QueryStringSearchStateGateway } from "~/features/redirects/loadRedirects/QueryStringSearchStateGateway.js";
import { SearchRepositoryWithQueryStringGateway } from "~/features/redirects/loadRedirects/SearchRepositoryWithQueryStringGateway.js";
import { filterRepositoryFactory } from "~/domain/Filter/index.js";

export class ListRedirectsRepositoryFactory {
    getRepository(gateway: IListRedirectsGateway): IListRedirectsRepository {
        const namespace = "WbRedirect";

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

        return new ListRedirectsRepository(
            redirectListCache,
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

export const listRedirectsRepositoryFactory = new ListRedirectsRepositoryFactory();
