import { loadingRepositoryFactory, metaRepositoryFactory } from "@webiny/app-utils";
import { IListPagesUseCase } from "./IListPagesUseCase.js";
import { IListPagesGateway } from "./IListPagesGateway.js";
import { ListPagesRepository } from "./ListPagesRepository.js";
import { ListPagesUseCase } from "./ListPagesUseCase.js";
import { pageCacheFactory } from "~/domains/Page/index.js";
import { paramsRepositoryFactory } from "~/domains/Params/index.js";

export class ListPages {
    public static getInstance(gateway: IListPagesGateway): IListPagesUseCase {
        const pagesCache = pageCacheFactory.getCache();
        const loadingRepository = loadingRepositoryFactory.getRepository("WbPage");
        const metaRepository = metaRepositoryFactory.getRepository("WbPage");
        const paramsRepository = paramsRepositoryFactory.getRepository("WbPage");
        const repository = new ListPagesRepository(
            pagesCache,
            metaRepository,
            loadingRepository,
            paramsRepository,
            gateway
        );
        return new ListPagesUseCase(repository);
    }
}
