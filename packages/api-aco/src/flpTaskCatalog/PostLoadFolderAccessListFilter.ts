import { Result } from "@webiny/feature/api";
import type { CmsEntryValues } from "@webiny/api-headless-cms/types/index.js";
import type { IListEntriesResult } from "@webiny/api-headless-cms/features/contentEntry/ListEntries/abstractions.js";
import { FolderAccessListFilter } from "~/features/flp/FolderAccessListFilter/abstractions.js";
import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/abstractions.js";
import { ListEntriesFactory } from "./listEntries/ListEntriesFactory.js";
import type { ListFoldersUseCase } from "~/features/folder/ListFolders/abstractions.js";
import type { Folder, ListFoldersParams } from "~/folder/folder.types.js";
import type { FolderPermission } from "~/flp/flp.types.js";
import { ROOT_FOLDER } from "~/constants.js";

/**
 * Loads a page, then drops the items in folders the identity cannot read. Entries are loaded page by
 * page until the requested number is reached.
 *
 * Permissions are cached per folder for the lifetime of this instance.
 */
class PostLoadFolderAccessListFilterImpl implements FolderAccessListFilter.Interface {
    private readonly listEntriesHandler: ListEntriesFactory;
    private readonly folderPermissions: Map<string, FolderPermission[]> = new Map();

    constructor(private folderLevelPermissions: FolderLevelPermissions.Interface) {
        this.listEntriesHandler = new ListEntriesFactory(folderLevelPermissions);
    }

    async listEntries<T extends CmsEntryValues>({
        model,
        params,
        loader
    }: FolderAccessListFilter.ListEntriesParams<T>): Promise<IListEntriesResult<T>> {
        return this.listEntriesHandler.execute<T>({
            model,
            dataLoader: loader,
            initialParams: params
        });
    }

    async listFolders(
        params: ListFoldersParams,
        loader: FolderAccessListFilter.ListFoldersLoader
    ): ListFoldersUseCase.Return {
        const result = await loader(params);
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        const { folders, meta } = result.value;

        // Fetch FLP records for ROOT folders and populate the cache.
        const rootFlps = await this.folderLevelPermissions.listFolderLevelPermissions({
            where: {
                type: params.where.type,
                parentId: ROOT_FOLDER
            }
        });

        rootFlps.forEach(flp => this.folderPermissions.set(flp.id, flp.permissions));

        // Fetch FLP for folders not already in the cache.
        await Promise.all(
            folders.map(async folder => {
                if (!this.folderPermissions.has(folder.id)) {
                    const permissions = await this.folderLevelPermissions.getFolderLevelPermissions(
                        folder.id
                    );
                    this.folderPermissions.set(folder.id, permissions);
                }
            })
        );

        // Filter folders based on permissions.
        const foldersWithPermissions = await Promise.all(
            folders.map(async folder => {
                const permissions = this.folderPermissions.get(folder.id);
                if (!permissions) {
                    return null;
                }

                const canAccessFolder = await this.folderLevelPermissions.canAccessFolder({
                    permissions,
                    rwd: "r"
                });

                if (!canAccessFolder) {
                    return null;
                }

                return { ...folder, permissions };
            })
        );

        return Result.ok({ folders: foldersWithPermissions.filter(Boolean) as Folder[], meta });
    }
}

export const PostLoadFolderAccessListFilter = FolderAccessListFilter.createImplementation({
    implementation: PostLoadFolderAccessListFilterImpl,
    dependencies: [FolderLevelPermissions]
});
