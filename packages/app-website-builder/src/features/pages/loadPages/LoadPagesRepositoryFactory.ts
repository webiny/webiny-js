import {
    loadingRepositoryFactory,
    metaRepositoryFactory,
    sortRepositoryFactory
} from "@webiny/app-utils";
import { pageCacheFactory } from "~/domain/Page/index.js";
import { paramsRepositoryFactory } from "~/domain/Params/index.js";
import { searchRepositoryFactory } from "~/domain/Search/index.js";
import type { IListPagesGateway } from "~/features/pages/loadPages/IListPagesGateway.js";
import { LoadPagesRepository } from "~/features/pages/loadPages/LoadPagesRepository.js";
import type { ILoadPagesRepository } from "~/features/pages/loadPages/ILoadPagesRepository.js";

export class LoadPagesRepositoryFactory {
    getRepository(gateway: IListPagesGateway): ILoadPagesRepository {
        const namespace = "WbPage";

        const pagesCache = pageCacheFactory.getCache();
        const loadingRepository = loadingRepositoryFactory.getRepository(namespace);
        const metaRepository = metaRepositoryFactory.getRepository(namespace);
        const paramsRepository = paramsRepositoryFactory.getRepository(namespace);
        const searchRepository = searchRepositoryFactory.getRepository(namespace);
        const sortingRepository = sortRepositoryFactory.getRepository(namespace);

        return new LoadPagesRepository(
            pagesCache,
            loadingRepository,
            metaRepository,
            paramsRepository,
            searchRepository,
            sortingRepository,
            gateway
        );
    }
}

export const loadPagesRepositoryFactory = new LoadPagesRepositoryFactory();
