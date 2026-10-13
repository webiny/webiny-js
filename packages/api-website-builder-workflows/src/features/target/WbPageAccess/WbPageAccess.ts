import { WbPermissions } from "@webiny/api-website-builder/features/permissions/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { FolderLevelPermissions } from "@webiny/api-aco/features/flp/FolderLevelPermissions/index.js";
import { ROOT_FOLDER } from "@webiny/api-website-builder/constants.js";
import type { WbPageTarget } from "../WbPageTargetReader/abstractions.js";
import { WbPageAccess as Abstraction } from "./abstractions.js";

/**
 * Write and delete include read, because WB loads the page through `GetPageByIdUseCase` before it
 * updates or trashes it (R82). Folder-level permissions as the ACO CMS decorators apply them to
 * page entries, inline in each check, as `CmsEntryAccess` does (R78).
 */
class WbPageAccessImpl implements Abstraction.Interface {
    public constructor(
        private permissions: WbPermissions.Interface,
        private identityContext: IdentityContext.Interface,
        private folderLevelPermissions: FolderLevelPermissions.Interface
    ) {}

    public canWriteAnyPage(): Promise<boolean> {
        return this.permissions.canEdit("page");
    }

    public canDeleteAnyPage(): Promise<boolean> {
        // Entity-level `canDelete` treats an own-only permission as "no item, no match"; passing
        // the current identity as creator makes any delete permission pass.
        const identity = this.identityContext.getIdentity();
        return this.permissions.canDelete("page", { createdBy: { id: identity.id } });
    }

    public async canRead(target: WbPageTarget): Promise<boolean> {
        if (!(await this.permissions.canRead("page"))) {
            return false;
        }
        if (!(await this.permissions.canAccess("page", target.page))) {
            return false;
        }
        // Folder-level permissions are skipped when FLP is not in use for the identity (e.g. API
        // keys) or the page is in the root folder, as the ACO CMS decorators do.
        if (!this.folderLevelPermissions.canUseFolderLevelPermissions()) {
            return true;
        }
        const folderId = target.page.location.folderId;
        if (!folderId || folderId === ROOT_FOLDER) {
            return true;
        }
        const permissions = await this.folderLevelPermissions.getFolderLevelPermissions(folderId);
        return this.folderLevelPermissions.canAccessFolderContent({ permissions, rwd: "r" });
    }

    public async canReadInFolder(folderId: string | null): Promise<boolean> {
        if (!(await this.permissions.canRead("page"))) {
            return false;
        }
        // Folder-level permissions are skipped when FLP is not in use for the identity (e.g. API
        // keys) or for the root folder, as the ACO CMS decorators do.
        if (!this.folderLevelPermissions.canUseFolderLevelPermissions()) {
            return true;
        }
        if (!folderId || folderId === ROOT_FOLDER) {
            return true;
        }
        const permissions = await this.folderLevelPermissions.getFolderLevelPermissions(folderId);
        return this.folderLevelPermissions.canAccessFolderContent({ permissions, rwd: "r" });
    }

    public async canWrite(target: WbPageTarget): Promise<boolean> {
        if (!(await this.permissions.canRead("page"))) {
            return false;
        }
        if (!(await this.permissions.canAccess("page", target.page))) {
            return false;
        }
        if (!(await this.permissions.canEdit("page", target.page))) {
            return false;
        }
        // Folder-level permissions are skipped when FLP is not in use for the identity (e.g. API
        // keys) or the page is in the root folder, as the ACO CMS decorators do.
        if (!this.folderLevelPermissions.canUseFolderLevelPermissions()) {
            return true;
        }
        const folderId = target.page.location.folderId;
        if (!folderId || folderId === ROOT_FOLDER) {
            return true;
        }
        const permissions = await this.folderLevelPermissions.getFolderLevelPermissions(folderId);
        return this.folderLevelPermissions.canAccessFolderContent({ permissions, rwd: "w" });
    }

    public async canDelete(target: WbPageTarget): Promise<boolean> {
        if (!(await this.permissions.canRead("page"))) {
            return false;
        }
        if (!(await this.permissions.canAccess("page", target.page))) {
            return false;
        }
        if (!(await this.permissions.canDelete("page", target.page))) {
            return false;
        }
        // Folder-level permissions are skipped when FLP is not in use for the identity (e.g. API
        // keys) or the page is in the root folder, as the ACO CMS decorators do.
        if (!this.folderLevelPermissions.canUseFolderLevelPermissions()) {
            return true;
        }
        const folderId = target.page.location.folderId;
        if (!folderId || folderId === ROOT_FOLDER) {
            return true;
        }
        const permissions = await this.folderLevelPermissions.getFolderLevelPermissions(folderId);
        return this.folderLevelPermissions.canAccessFolderContent({ permissions, rwd: "d" });
    }
}

export const WbPageAccess = Abstraction.createImplementation({
    implementation: WbPageAccessImpl,
    dependencies: [WbPermissions, IdentityContext, FolderLevelPermissions]
});
