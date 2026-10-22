import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { FolderLevelPermissions } from "@webiny/api-aco/features/flp/FolderLevelPermissions/index.js";
import { WB_PAGE_FOLDER_TYPE } from "~/constants.js";
import { WbPageDeniedFolders as Abstraction } from "./abstractions.js";

/**
 * Registered per request, so the cache lives for one request. Keyed by identity id, because
 * `withIdentity` can switch the identity mid-request.
 */
class WbPageDeniedFoldersImpl implements Abstraction.Interface {
    private readonly cache = new Map<string, string[]>();

    public constructor(
        private identityContext: IdentityContext.Interface,
        private folderLevelPermissions: FolderLevelPermissions.Interface
    ) {}

    public async listDeniedFolderIds(): Promise<string[]> {
        // Skipped when FLP is not in use for the identity, as the ACO CMS decorators do.
        if (!this.folderLevelPermissions.canUseFolderLevelPermissions()) {
            return [];
        }
        const identity = this.identityContext.getIdentity();
        const cached = this.cache.get(identity.id);
        if (cached) {
            return [...cached];
        }

        const records = await this.folderLevelPermissions.listFolderLevelPermissions({
            where: { type: WB_PAGE_FOLDER_TYPE }
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
        this.cache.set(identity.id, denied);
        return [...denied];
    }
}

export const WbPageDeniedFolders = Abstraction.createImplementation({
    implementation: WbPageDeniedFoldersImpl,
    dependencies: [IdentityContext, FolderLevelPermissions]
});
