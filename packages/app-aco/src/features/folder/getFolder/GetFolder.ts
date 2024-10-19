import { loadingRepositoryFactory } from "@webiny/app-utils";
import { IGetFolderUseCase } from "./IGetFolderUseCase";
import { IGetFolderGateway } from "./IGetFolderGateway";
import { GetFolderRepository } from "./GetFolderRepository";
import { GetFolderUseCase } from "./GetFolderUseCase";
import { GetFolderUseCaseWithLoading } from "./GetFolderUseCaseWithLoading";
import { folderCacheFactory } from "../cache";

export class GetFolder {
    static cache: Map<string, IGetFolderUseCase> = new Map();

    public static instance(gateway: IGetFolderGateway, type: string): IGetFolderUseCase {
        if (!this.cache.has(type)) {
            // Create a new instance if not cached
            const foldersCache = folderCacheFactory.getCache(type);
            const loadingRepository = loadingRepositoryFactory.getRepository();
            const repository = new GetFolderRepository(foldersCache, gateway);
            const useCase = new GetFolderUseCase(repository);
            const useCaseWithLoading = new GetFolderUseCaseWithLoading(loadingRepository, useCase);

            // Store in cache
            this.cache.set(type, useCaseWithLoading);
        }

        // Return the cached instance
        return this.cache.get(type)!;
    }
}
