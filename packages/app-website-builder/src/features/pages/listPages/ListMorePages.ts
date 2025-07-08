import type { IListMorePagesUseCase } from "~/features/pages/listPages/IListMorePagesUseCase.js";
import { IListPagesGateway } from "~/features/pages/listPages/IListPagesGateway.js";
import { pageCacheFactory } from "~/domains/Page/index.js";
import { loadingRepositoryFactory, metaRepositoryFactory } from "@webiny/app-utils";
import { paramsRepositoryFactory } from "~/domains/Params/index.js";
import { ListPagesRepository } from "~/features/pages/listPages/ListPagesRepository.js";
import { ListMorePagesUseCase } from "~/features/pages/listPages/ListMorePagesUseCase.js";

interface ListMorePagesInstance {
    useCase: IListMorePagesUseCase;
}

export class ListMorePages {
    public static getInstance(gateway: IListPagesGateway): ListMorePagesInstance {
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

        const useCase = new ListMorePagesUseCase(repository, metaRepository);

        return {
            useCase
        };
    }
}
