import { DeleteFolderGateway } from "./abstractions.js";
import { DeleteFolderRepository as RepositoryAbstraction } from "./abstractions.js";
import { FoldersCache } from "~/features/folders/abstractions.js";

class DeleteFolderRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cache: FoldersCache.Interface,
        private gateway: DeleteFolderGateway.Interface
    ) {}

    async execute(id: string) {
        await this.gateway.execute(id);
        this.cache.removeItems(f => f.id === id);
    }
}

export const DeleteFolderRepository = RepositoryAbstraction.createImplementation({
    implementation: DeleteFolderRepositoryImpl,
    dependencies: [FoldersCache, DeleteFolderGateway]
});
