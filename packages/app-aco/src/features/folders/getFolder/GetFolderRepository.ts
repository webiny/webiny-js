import { Folder } from "~/domain/folder/Folder.js";
import { GetFolderRepository as RepositoryAbstraction } from "./abstractions.js";
import { GetFolderGateway } from "./abstractions.js";
import { FoldersCache } from "~/features/folders/abstractions.js";

class GetFolderRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cache: FoldersCache.Interface,
        private gateway: GetFolderGateway.Interface
    ) {}

    async execute(id: string) {
        const response = await this.gateway.execute(id);
        this.cache.addItems([Folder.create(response)]);
    }
}

export const GetFolderRepository = RepositoryAbstraction.createImplementation({
    implementation: GetFolderRepositoryImpl,
    dependencies: [FoldersCache, GetFolderGateway]
});
