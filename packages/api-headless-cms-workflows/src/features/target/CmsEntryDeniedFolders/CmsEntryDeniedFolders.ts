import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { FolderLevelPermissions } from "@webiny/api-aco/features/flp/FolderLevelPermissions/index.js";
import { ROOT_FOLDER } from "@webiny/api-aco/constants.js";
import { toCmsFolderType } from "~/utils/folderType.js";
import type { FolderReadRule } from "../FolderReadRule.js";
import { CmsEntryDeniedFolders as Abstraction } from "./abstractions.js";

/**
 * Registered as a singleton in the request container, so the cache lives for one request. Keyed
 * by identity id and folder type, because `withIdentity` can switch the identity mid-request.
 */
class CmsEntryDeniedFoldersImpl implements Abstraction.Interface {
    private readonly cache = new Map<string, string[]>();

    public constructor(
        private identityContext: IdentityContext.Interface,
        private folderLevelPermissions: FolderLevelPermissions.Interface
    ) {}

    public async listDeniedFolderIds(modelIds: string[]): Promise<string[]> {
        // Skipped when FLP is not in use for the identity, as the ACO CMS decorators do.
        if (!this.folderLevelPermissions.canUseFolderLevelPermissions()) {
            return [];
        }
        const identity = this.identityContext.getIdentity();
        const uniqueModelIds = [...new Set(modelIds)];
        // ACO lists folder permissions of one folder type at a time, so each model's folders take
        // one read; they run concurrently, never one read per folder or per entry.
        const deniedPerType = await Promise.all(
            uniqueModelIds.map(modelId => {
                const type = toCmsFolderType(modelId);
                return this.listDeniedOfType(identity.id, type);
            })
        );
        return deniedPerType.flat();
    }

    public async createFolderReadRule(modelIds: string[]): Promise<FolderReadRule> {
        const deniedIds = await this.listDeniedFolderIds(modelIds);
        const denied = new Set(deniedIds);
        return {
            canReadFolder: async (folderId: string): Promise<boolean> => !denied.has(folderId)
        };
    }

    private async listDeniedOfType(identityId: string, type: string): Promise<string[]> {
        const key = `${identityId}#${type}`;
        const cached = this.cache.get(key);
        if (cached) {
            return [...cached];
        }

        // Every folder path starts at the root, and the storage lists a type only by parent or by
        // path prefix: the root prefix gives every folder of the type in one read.
        const records = await this.folderLevelPermissions.listFolderLevelPermissions({
            where: { type, path_startsWith: `${ROOT_FOLDER}/` }
        });
        const denied: string[] = [];
        for (const record of records) {
            // In memory: the record's permissions already carry the inherited and default ones.
            // oxlint-disable-next-line no-await-in-loop -- in memory: the record carries its permissions.
            const canRead = await this.folderLevelPermissions.canAccessFolderContent({
                permissions: record.permissions,
                rwd: "r"
            });
            if (!canRead) {
                denied.push(record.id);
            }
        }
        this.cache.set(key, denied);
        return [...denied];
    }
}

export const CmsEntryDeniedFolders = Abstraction.createImplementation({
    implementation: CmsEntryDeniedFoldersImpl,
    dependencies: [IdentityContext, FolderLevelPermissions]
});
