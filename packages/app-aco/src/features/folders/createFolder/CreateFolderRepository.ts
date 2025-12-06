import { FoldersContext } from "~/features/folders/abstractions.js";
import { Folder } from "../Folder.js";
import type { FolderDto } from "./abstractions.js";
import { CreateFolderGateway } from "./abstractions.js";
import { CreateFolderRepository as RepositoryAbstraction } from "./abstractions.js";
import { FoldersCache } from "~/features/folders/abstractions.js";

class CreateFolderRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cache: FoldersCache.Interface,
        private foldersContext: FoldersContext.Interface,
        private gateway: CreateFolderGateway.Interface
    ) {}

    async execute(folder: Folder) {
        const dto: FolderDto = {
            title: folder.title,
            slug: folder.slug,
            permissions: folder.permissions,
            type: this.foldersContext.type,
            parentId: folder.parentId,
            extensions: folder.extensions
        };

        const result = await this.gateway.execute(dto);
        this.cache.addItems([Folder.create(result)]);
    }
}

export const CreateFolderRepository = RepositoryAbstraction.createImplementation({
    implementation: CreateFolderRepositoryImpl,
    dependencies: [FoldersCache, FoldersContext, CreateFolderGateway]
});
