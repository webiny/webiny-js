import { LoadingRepository, loadingRepositoryFactory } from "@webiny/app-utils";
import { IListFoldersUseCase } from "./IListFoldersUseCase";
import { IListFoldersGateway } from "./IListFoldersGateway";
import { ListFoldersRepository } from "./ListFoldersRepository";
import { ListFoldersUseCaseWithLoading } from "./ListFoldersUseCaseWithLoading";
import { ListFoldersUseCase } from "./ListFoldersUseCase";
import { folderCacheFactory, FoldersCache } from "../cache";

interface IListFoldersInstance {
    useCase: IListFoldersUseCase;
    folders: FoldersCache;
    loading: LoadingRepository;
}

export class ListFolders {
    static useCaseCache: Map<string, IListFoldersUseCase> = new Map();
    static foldersCache: Map<string, FoldersCache> = new Map();
    static loadingCache: Map<string, LoadingRepository> = new Map();

    public static instance(type: string, gateway: IListFoldersGateway): IListFoldersInstance {
        if (!this.foldersCache.has(type)) {
            this.foldersCache.set(type, folderCacheFactory.getCache(type));
        }

        if (!this.loadingCache.has(type)) {
            this.loadingCache.set(type, loadingRepositoryFactory.getRepository());
        }

        if (!this.useCaseCache.has(type)) {
            // Create a new instance if not cached
            const foldersCache = this.foldersCache.get(type)!;
            const loadingRepository = this.loadingCache.get(type)!;
            const repository = new ListFoldersRepository(foldersCache, gateway, type);
            const useCase = new ListFoldersUseCase(repository);
            const useCaseWithLoading = new ListFoldersUseCaseWithLoading(
                loadingRepository,
                useCase
            );

            // Store in cache
            this.useCaseCache.set(type, useCaseWithLoading);
        }

        // Return the cached instance
        return {
            useCase: this.useCaseCache.get(type)!,
            folders: this.foldersCache.get(type)!,
            loading: this.loadingCache.get(type)!
        };
    }
}
