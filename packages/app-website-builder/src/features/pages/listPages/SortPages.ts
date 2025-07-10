import { IListPagesGateway } from "~/features/pages/listPages/IListPagesGateway.js";
import { pageCacheFactory } from "~/domain/Page/index.js";
import {
    loadingRepositoryFactory,
    metaRepositoryFactory,
    sortRepositoryFactory
} from "@webiny/app-utils";
import { paramsRepositoryFactory } from "~/domain/Params/index.js";
import { ListPagesRepository } from "~/features/pages/listPages/ListPagesRepository.js";
import { SortPagesUseCase } from "~/features/pages/listPages/SortPagesUseCase.js";
import type { ISortPagesUseCase } from "~/features/pages/listPages/ISortPagesUseCase.js";

interface SortPagesInstance {
    useCase: ISortPagesUseCase;
}

export class SortPages {
    public static getInstance(gateway: IListPagesGateway): SortPagesInstance {
        const pagesCache = pageCacheFactory.getCache();
        const metaRepository = metaRepositoryFactory.getRepository("WbPage");
        const loadingRepository = loadingRepositoryFactory.getRepository("WbPage");
        const paramsRepository = paramsRepositoryFactory.getRepository("WbPage");
        const sortRepository = sortRepositoryFactory.getRepository("WbPage");

        const repository = new ListPagesRepository(
            pagesCache,
            metaRepository,
            loadingRepository,
            paramsRepository,
            gateway
        );

        const useCase = new SortPagesUseCase(repository, sortRepository);

        return {
            useCase
        };
    }
}
