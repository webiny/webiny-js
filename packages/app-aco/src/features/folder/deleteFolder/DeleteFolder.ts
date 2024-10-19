import { loadingRepositoryFactory } from "@webiny/app-utils";
import { IDeleteFolderUseCase } from "./IDeleteFolderUseCase";
import { DeleteFolderRepository } from "./DeleteFolderRepository";
import { DeleteFolderUseCase } from "./DeleteFolderUseCase";
import { DeleteFolderUseCaseWithLoading } from "./DeleteFolderUseCaseWithLoading";
import { IDeleteFolderGateway } from "./IDeleteFolderGateway";
import { folderCacheFactory } from "../cache";

export class DeleteFolder {
    static cache: Map<string, IDeleteFolderUseCase> = new Map();

    public static getInstance(gateway: IDeleteFolderGateway, type: string): IDeleteFolderUseCase {
        if (!this.cache.has(type)) {
            // Create a new instance if not cached
            const foldersCache = folderCacheFactory.getCache(type);
            const loadingRepository = loadingRepositoryFactory.getRepository();
            const repository = new DeleteFolderRepository(foldersCache, gateway);
            const useCase = new DeleteFolderUseCase(repository);
            const useCaseWithLoading = new DeleteFolderUseCaseWithLoading(
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
