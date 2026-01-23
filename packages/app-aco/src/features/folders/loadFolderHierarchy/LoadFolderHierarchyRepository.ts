import { Folder } from "~/domain/folder/Folder.js";
import {
    LoadFolderHierarchyRepository as RepositoryAbstraction,
    LoadFolderHierarchyGateway
} from "./abstractions.js";
import {
    FoldersCache,
    LoadedFoldersCache,
    FoldersContext
} from "~/features/folders/abstractions.js";

class LoadFolderHierarchyRepositoryImpl implements RepositoryAbstraction.Interface {
    private pendingPromises = new Map<string, Promise<void>>();

    constructor(
        private cache: FoldersCache.Interface,
        private loadedCache: LoadedFoldersCache.Interface,
        private gateway: LoadFolderHierarchyGateway.Interface,
        private foldersContext: FoldersContext.Interface
    ) {}

    async execute(id: string) {
        // Return pending promise if one exists
        const pendingPromise = this.pendingPromises.get(id);
        if (pendingPromise) {
            return pendingPromise;
        }

        // Create new promise with cleanup and cache it
        const promise = this.loadFolders(id).finally(() => {
            this.pendingPromises.delete(id);
        });

        // Store the promise
        this.pendingPromises.set(id, promise);

        return promise;
    }

    private async loadFolders(id: string) {
        const existingCache = this.loadedCache.getItem(item => item === id);
        if (existingCache) {
            return;
        }

        const response = await this.gateway.execute(this.foldersContext.type, id);

        const { parents = [], siblings = [] } = response;

        if (parents.length > 0) {
            this.loadedCache.addItems(parents.map(parent => parent.id));
        }

        this.cache.addItems([...parents, ...siblings].map(item => Folder.create(item)));
    }
}

export const LoadFolderHierarchyRepository = RepositoryAbstraction.createImplementation({
    implementation: LoadFolderHierarchyRepositoryImpl,
    dependencies: [FoldersCache, LoadedFoldersCache, LoadFolderHierarchyGateway, FoldersContext]
});
