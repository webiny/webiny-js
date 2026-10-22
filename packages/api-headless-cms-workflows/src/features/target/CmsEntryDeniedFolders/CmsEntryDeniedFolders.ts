import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { FolderLevelPermissions } from "@webiny/api-aco/features/flp/FolderLevelPermissions/index.js";
import { toCmsFolderType } from "~/utils/folderType.js";
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

    private async listDeniedOfType(identityId: string, type: string): Promise<string[]> {
        const key = `${identityId}#${type}`;
        const cached = this.cache.get(key);
        if (cached) {
            return [...cached];
        }

        const records = await this.folderLevelPermissions.listFolderLevelPermissions({
            where: { type }
        });
        const denied: string[] = [];
        for (const record of records) {
            // In memory: the record's permissions already carry the inherited and default ones.
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
