import { Folder } from "../Folder.js";
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
    constructor(
        private cache: FoldersCache.Interface,
        private loadedCache: LoadedFoldersCache.Interface,
        private gateway: LoadFolderHierarchyGateway.Interface,
        private foldersContext: FoldersContext.Interface
    ) {}

    async execute(id: string) {
        if (this.loadedCache.getItem(item => item === id)) {
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
