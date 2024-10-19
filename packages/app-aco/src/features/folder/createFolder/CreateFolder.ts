import { loadingRepositoryFactory } from "@webiny/app-utils";
import { ICreateFolderUseCase } from "./ICreateFolderUseCase";
import { ICreateFolderGateway } from "./ICreateFolderGateway";
import { CreateFolderRepository } from "./CreateFolderRepository";
import { CreateFolderUseCase } from "./CreateFolderUseCase";
import { CreateFolderUseCaseWithLoading } from "./CreateFolderUseCaseWithLoading";
import { folderCacheFactory } from "../cache";

export class CreateFolder {
    static cache: Map<string, ICreateFolderUseCase> = new Map();

    public static instance(gateway: ICreateFolderGateway, type: string): ICreateFolderUseCase {
        if (!this.cache.has(type)) {
            // Create a new instance if not cached
            const foldersCache = folderCacheFactory.getCache(type);
            const loadingRepository = loadingRepositoryFactory.getRepository();
            const repository = new CreateFolderRepository(foldersCache, gateway, type);
            const useCase = new CreateFolderUseCase(repository);
            const useCaseWithLoading = new CreateFolderUseCaseWithLoading(
                loadingRepository,
                useCase
            );

            // Store in cache
            this.cache.set(type, useCaseWithLoading);
        }

        // Return the cached instance
        return this.cache.get(type)!;
    }
}
