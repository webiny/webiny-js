import type {
    CmsEntry,
    CmsEntryListParams,
    CmsEntryMeta,
    CmsEntryValues
} from "@webiny/api-headless-cms/types/index.js";
import { type CmsModel } from "@webiny/api-headless-cms/types/index.js";
import { hasRootFolderId } from "~/utils/decorators/hasRootFolderId.js";
import type { FolderPermission } from "~/flp/flp.types.js";
import { FolderLevelPermissions } from "~/features/flp/FolderLevelPermissions/index.js";

interface ListEntriesFactoryCallbackParams {
    decoratee: <T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryListParams
    ) => Promise<[CmsEntry<T>[], CmsEntryMeta]>;
    model: CmsModel;
    initialParams?: CmsEntryListParams;
}

export class ListEntriesFactory {
    private readonly folderLevelPermissions: FolderLevelPermissions.Interface;
    private readonly permissionsCache: Map<string, FolderPermission[]>;

    constructor(folderLevelPermissions: FolderLevelPermissions.Interface) {
        this.folderLevelPermissions = folderLevelPermissions;
        this.permissionsCache = new Map();
    }

    public async execute({
        decoratee,
        model,
        initialParams = {}
    }: ListEntriesFactoryCallbackParams): Promise<[CmsEntry[], CmsEntryMeta]> {
        const limit = initialParams?.limit || 50;
        const where = initialParams?.where;
        const params = { ...initialParams, limit };
        const hasRootFolder = hasRootFolderId({ model, where });

        // If FLP should be skipped, or we're querying the root folder, skip permission checks
        if (!this.folderLevelPermissions.canUseFolderLevelPermissions() || hasRootFolder) {
            return await decoratee(model, params);
        }

        const resultEntries: CmsEntry[] = [];
        let totalCount = 0;
        let hasMoreItems = true;
        let cursor: string | null = null;
        let fetchedAll = false;
        let afterCursor = params.after;

        // Process entries in batches until we have enough results or reach the end
        while (!fetchedAll) {
            const queryParams: CmsEntryListParams = { ...params, after: afterCursor };
            const [entries, currentMeta] = await decoratee(model, queryParams);

            if (totalCount === 0) {
                totalCount = currentMeta.totalCount;
            }

            // Process each entry and check folder permissions
            for (const entry of entries) {
                const folderId = entry.values?.location?.folderId || entry.location?.folderId;

                // If entry has no folderId, it's not using ACO folders system
                // Include it in results as it's not subject to folder permissions
                if (!folderId) {
                    resultEntries.push(entry);
                    continue;
                }

                const permissions = await this.getPermissions(folderId);

                // If no FLP exists for the folder, the entry is accessible
                // This means the folder doesn't have any permission restrictions
                if (!permissions.length) {
                    resultEntries.push(entry);
                    continue;
                }

                // Check if user has read permission for the folder
                if (
                    await this.folderLevelPermissions.canAccessFolderContent({
                        permissions,
                        rwd: "r"
                    })
                ) {
                    resultEntries.push(entry);
                } else {
                    totalCount--;
                }
            }

            // Determine if we need to fetch more entries
            if (!currentMeta.hasMoreItems || resultEntries.length >= limit) {
                fetchedAll = true;
                hasMoreItems = currentMeta.hasMoreItems;
                cursor = currentMeta.cursor;
            } else {
                afterCursor = currentMeta.cursor;
            }
        }

        return [resultEntries, { totalCount, hasMoreItems, cursor } as CmsEntryMeta];
    }

    private async getPermissions(folderId: string): Promise<FolderPermission[]> {
        if (this.permissionsCache.has(folderId)) {
            return this.permissionsCache.get(folderId) ?? [];
        }

        const permissions = await this.folderLevelPermissions.getFolderLevelPermissions(folderId);
        this.permissionsCache.set(folderId, permissions);
        return permissions;
    }
}
