import { AcoFlpCrud } from "~/features/folder/shared/abstractions.js";
import { FolderPermissionsRepository } from "~/features/flp/FolderPermissionsRepository/abstractions.js";
import type { FolderLevelPermission } from "~/flp/flp.types.js";
import { ROOT_FOLDER } from "~/constants.js";

/**
 * Reads the FLP catalog: one record per folder, with the inherited permissions already copied in by
 * the FLP tasks.
 */
class CatalogFolderPermissionsRepositoryImpl implements FolderPermissionsRepository.Interface {
    constructor(private flpCrud: AcoFlpCrud.Interface) {}

    async get(folderId: string): Promise<FolderLevelPermission | null> {
        return this.flpCrud.get(folderId);
    }

    async list({
        where
    }: FolderPermissionsRepository.ListParams): Promise<FolderLevelPermission[]> {
        if (where.parentId) {
            return this.flpCrud.list({ where: { type: where.type, parentId: where.parentId } });
        }
        // Every folder's path starts at the root, so the root prefix is every folder of the type.
        return this.flpCrud.list({
            where: { type: where.type, path_startsWith: where.path_startsWith ?? `${ROOT_FOLDER}/` }
        });
    }
}

export const CatalogFolderPermissionsRepository = FolderPermissionsRepository.createImplementation({
    implementation: CatalogFolderPermissionsRepositoryImpl,
    dependencies: [AcoFlpCrud]
});
