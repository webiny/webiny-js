import { ListFoldersByParentIdsRepository as RepositoryAbstraction } from "../abstractions.js";
import { LoadedFoldersCache } from "~/features/folders/abstractions.js";

class ListFoldersByParentIdsRepositoryWithLoadedCacheImpl
    implements RepositoryAbstraction.Interface
{
    constructor(
        private loadedCache: LoadedFoldersCache.Interface,
        private decoratee: RepositoryAbstraction.Interface
    ) {}

    async execute(parentIds: string[]) {
        if (this.loadedCache.count() === 0) {
            await this.decoratee.execute(parentIds);
            this.loadedCache.addItems(parentIds);
            return;
        }

        // Find folder IDs that are not in the cache
        const missingParentIds = parentIds.filter(
            parentId => !this.loadedCache.getItems().includes(parentId)
        );

        if (missingParentIds.length === 0) {
            // Nothing new to load.
            return;
        }

        this.loadedCache.addItems(missingParentIds);

        await this.decoratee.execute(missingParentIds);
    }
}

export const RepositoryWithLoadedCache = RepositoryAbstraction.createDecorator({
    decorator: ListFoldersByParentIdsRepositoryWithLoadedCacheImpl,
    dependencies: [LoadedFoldersCache]
});
