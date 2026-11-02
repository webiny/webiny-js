import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { FolderLevelPermissions } from "@webiny/api-aco/features/flp/FolderLevelPermissions/index.js";
import { ROOT_FOLDER } from "@webiny/api-aco/constants.js";
import { WB_PAGE_FOLDER_TYPE } from "~/constants.js";
import type { FolderReadRule } from "@webiny/api-headless-cms-workflows/features/target/FolderReadRule.js";
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

        // Every folder path starts at the root, and the storage lists a type only by parent or by
        // path prefix: the root prefix gives every folder of the type in one read.
        const records = await this.folderLevelPermissions.listFolderLevelPermissions({
            where: { type: WB_PAGE_FOLDER_TYPE, path_startsWith: `${ROOT_FOLDER}/` }
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
        this.cache.set(identity.id, denied);
        return [...denied];
    }

    public async createFolderReadRule(): Promise<FolderReadRule> {
        const deniedIds = await this.listDeniedFolderIds();
        const denied = new Set(deniedIds);
        return {
            canReadFolder: async (folderId: string): Promise<boolean> => !denied.has(folderId)
        };
    }
}

export const WbPageDeniedFolders = Abstraction.createImplementation({
    implementation: WbPageDeniedFoldersImpl,
    dependencies: [IdentityContext, FolderLevelPermissions]
});
