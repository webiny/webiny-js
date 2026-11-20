import { EntryId } from "@webiny/api-headless-cms/exports/api/cms/entry.js";
import { FolderPermissionsRepository } from "@webiny/api-aco/features/flp/FolderPermissionsRepository/abstractions.js";
import { FolderModelProvider } from "@webiny/api-aco/domain/folder/abstractions.js";
import type { FolderLevelPermission } from "@webiny/api-aco/flp/flp.types.js";
import { FolderCatalog } from "~/catalog/FolderCatalog.js";

/** Folder permissions worked out from the folder catalog: own grants plus inherited ones. */
class PgFolderPermissionsRepositoryImpl implements FolderPermissionsRepository.Interface {
    public constructor(
        private readonly catalog: FolderCatalog.Interface,
        private readonly folderModelProvider: FolderModelProvider.Interface
    ) {}

    public async get(folderId: string): Promise<FolderLevelPermission | null> {
        const { id } = EntryId.from(folderId);
        const folderModel = await this.folderModelProvider.get();
        const result = await this.catalog.getEffective(folderModel, [id]);
        return result.get(id) ?? null;
    }

    public async list(
        params: FolderPermissionsRepository.ListParams
    ): Promise<FolderLevelPermission[]> {
        const folderModel = await this.folderModelProvider.get();
        const ids = await this.catalog.listIds(folderModel, params.where);
        const result = await this.catalog.getEffective(folderModel, ids);
        return ids.map(id => result.get(id)).filter((flp): flp is FolderLevelPermission => !!flp);
    }
}

export const PgFolderPermissionsRepository = FolderPermissionsRepository.createImplementation({
    implementation: PgFolderPermissionsRepositoryImpl,
    dependencies: [FolderCatalog, FolderModelProvider]
});
