import {
    LoadingRepository,
    loadingRepositoryFactory,
    MetaRepository,
    metaRepositoryFactory
} from "@webiny/app-utils";
import { IListPagesUseCase } from "./IListPagesUseCase.js";
import { IListPagesGateway } from "./IListPagesGateway.js";
import { ListPagesRepository } from "./ListPagesRepository.js";
import { ListPagesUseCase } from "./ListPagesUseCase.js";
import { ListCache, Page, pageCacheFactory } from "~/domains/Page/index.js";
import { paramsRepositoryFactory } from "~/domains/Params/index.js";

interface IListPagesInstance {
    useCase: IListPagesUseCase;
    pages: ListCache<Page>;
    loading: LoadingRepository;
    meta: MetaRepository;
}

export class ListPages {
    public static getInstance(gateway: IListPagesGateway): IListPagesInstance {
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

        const useCase = new ListPagesUseCase(repository);

        return {
            useCase,
            pages: pagesCache,
            loading: loadingRepository,
            meta: metaRepository
        };
    }
}
