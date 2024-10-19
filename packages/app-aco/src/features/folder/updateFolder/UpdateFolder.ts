import { loadingRepositoryFactory } from "@webiny/app-utils";
import { IUpdateFolderUseCase } from "./IUpdateFolderUseCase";
import { IUpdateFolderGateway } from "./IUpdateFolderGateway";
import { UpdateFolderRepository } from "./UpdateFolderRepository";
import { UpdateFolderUseCase } from "./UpdateFolderUseCase";
import { UpdateFolderUseCaseWithLoading } from "./UpdateFolderUseCaseWithLoading";
import { folderCacheFactory } from "~/features/folder";

export class UpdateFolder {
    static cache: Map<string, IUpdateFolderUseCase> = new Map();

    public static instance(gateway: IUpdateFolderGateway, type: string): IUpdateFolderUseCase {
        if (!this.cache.has(type)) {
            // Create a new instance if not cached
            const foldersCache = folderCacheFactory.getCache(type);
            const loadingRepository = loadingRepositoryFactory.getRepository();
            const repository = new UpdateFolderRepository(foldersCache, gateway);
            const useCase = new UpdateFolderUseCase(repository);
            const useCaseWithLoading = new UpdateFolderUseCaseWithLoading(
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
