import { Folder } from "~/domain/folder/Folder.js";
import { FoldersCache } from "../abstractions.js";
import {
    UpdateFolderRepository as RepositoryAbstraction,
    UpdateFolderGateway
} from "./abstractions.js";

class UpdateFolderRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cache: FoldersCache.Interface,
        private gateway: UpdateFolderGateway.Interface
    ) {}

    async execute(folder: Folder) {
        const result = await this.gateway.execute({
            id: folder.id,
            title: folder.title,
            slug: folder.slug,
            extensions: folder.extensions,
            parentId: folder.parentId,
            permissions: folder.permissions
        });

        this.cache.updateItems(f => {
            if (f.id === folder.id) {
                return Folder.create(result);
            }

            return Folder.create(f);
        });
    }
}

export const UpdateFolderRepository = RepositoryAbstraction.createImplementation({
    implementation: UpdateFolderRepositoryImpl,
    dependencies: [FoldersCache, UpdateFolderGateway]
});
