import { AccessControl } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { GetGroupUseCase } from "@webiny/api-headless-cms/features/contentModelGroup/GetGroup/index.js";
import { FolderLevelPermissions } from "@webiny/api-aco/features/flp/FolderLevelPermissions/index.js";
import { ROOT_FOLDER } from "@webiny/api-headless-cms/constants.js";
import { getModelIdFromAppName } from "~/utils/appName.js";
import type { CmsEntryTarget } from "../CmsEntryTargetReader/abstractions.js";
import { CmsEntryAccess as Abstraction } from "./abstractions.js";
import { UNREADABLE_CODES } from "./unreadableCodes.js";

/**
 * Group and model read first (what `GetModelUseCase` and the group cache enforce for the current
 * identity), then the entry permission, then FLP as `GetEntryByIdWithFlpDecorator`,
 * `UpdateEntryWithFlpDecorator` and `DeleteEntryWithFlpDecorator` (api-aco) apply it.
 *
 * Models with `authorization: false` (entry checks disabled) are still refused at the group check
 * for an identity without group read: `canAccessGroup` does not look at the model's flag. That
 * fails closed and is stricter than the CMS's own entry use cases.
 */
class CmsEntryAccessImpl implements Abstraction.Interface {
    public constructor(
        private accessControl: AccessControl.Interface,
        private getModel: GetModelUseCase.Interface,
        private getGroup: GetGroupUseCase.Interface,
        private folderLevelPermissions: FolderLevelPermissions.Interface
    ) {}

    public async canRead(target: CmsEntryTarget): Promise<boolean> {
        if (!(await this.accessControl.canAccessGroup({ group: target.group }))) {
            return false;
        }
        if (!(await this.accessControl.canAccessModel({ model: target.model }))) {
            return false;
        }
        const canAccessEntry = await this.accessControl.canAccessEntry({
            model: target.model,
            entry: target.entry,
            rwd: "r"
        });
        if (!canAccessEntry) {
            return false;
        }
        // Folder-level permissions are skipped when FLP is not in use for the identity (e.g. API
        // keys) or the entry is in the root folder, as the ACO CMS decorators do.
        if (!this.folderLevelPermissions.canUseFolderLevelPermissions()) {
            return true;
        }
        const folderId = target.entry.location?.folderId;
        if (!folderId || folderId === ROOT_FOLDER) {
            return true;
        }
        const permissions = await this.folderLevelPermissions.getFolderLevelPermissions(folderId);
        return this.folderLevelPermissions.canAccessFolderContent({ permissions, rwd: "r" });
    }

    public async canWrite(target: CmsEntryTarget): Promise<boolean> {
        if (!(await this.accessControl.canAccessGroup({ group: target.group }))) {
            return false;
        }
        if (!(await this.accessControl.canAccessModel({ model: target.model }))) {
            return false;
        }
        const canAccessEntry = await this.accessControl.canAccessEntry({
            model: target.model,
            entry: target.entry,
            rwd: "w"
        });
        if (!canAccessEntry) {
            return false;
        }
        // Folder-level permissions are skipped when FLP is not in use for the identity (e.g. API
        // keys) or the entry is in the root folder, as the ACO CMS decorators do.
        if (!this.folderLevelPermissions.canUseFolderLevelPermissions()) {
            return true;
        }
        const folderId = target.entry.location?.folderId;
        if (!folderId || folderId === ROOT_FOLDER) {
            return true;
        }
        const permissions = await this.folderLevelPermissions.getFolderLevelPermissions(folderId);
        return this.folderLevelPermissions.canAccessFolderContent({ permissions, rwd: "w" });
    }

    public async canDelete(target: CmsEntryTarget): Promise<boolean> {
        if (!(await this.accessControl.canAccessGroup({ group: target.group }))) {
            return false;
        }
        if (!(await this.accessControl.canAccessModel({ model: target.model }))) {
            return false;
        }
        const canAccessEntry = await this.accessControl.canAccessEntry({
            model: target.model,
            entry: target.entry,
            rwd: "d"
        });
        if (!canAccessEntry) {
            return false;
        }
        // Folder-level permissions are skipped when FLP is not in use for the identity (e.g. API
        // keys) or the entry is in the root folder, as the ACO CMS decorators do.
        if (!this.folderLevelPermissions.canUseFolderLevelPermissions()) {
            return true;
        }
        const folderId = target.entry.location?.folderId;
        if (!folderId || folderId === ROOT_FOLDER) {
            return true;
        }
        const permissions = await this.folderLevelPermissions.getFolderLevelPermissions(folderId);
        return this.folderLevelPermissions.canAccessFolderContent({ permissions, rwd: "d" });
    }

    public async canReadInFolder(params: Abstraction.FolderReadParams): Promise<boolean> {
        if (!(await this.accessControl.canAccessGroup({ group: params.group }))) {
            return false;
        }
        if (!(await this.accessControl.canAccessModel({ model: params.model }))) {
            return false;
        }
        const canAccessEntries = await this.accessControl.canAccessEntry({
            model: params.model,
            rwd: "r"
        });
        if (!canAccessEntries) {
            return false;
        }
        // As for an entry: skipped when FLP is not in use for the identity or for the root folder.
        if (!this.folderLevelPermissions.canUseFolderLevelPermissions()) {
            return true;
        }
        if (!params.folderId || params.folderId === ROOT_FOLDER) {
            return true;
        }
        const permissions = await this.folderLevelPermissions.getFolderLevelPermissions(
            params.folderId
        );
        return this.folderLevelPermissions.canAccessFolderContent({ permissions, rwd: "r" });
    }

    public async canDeleteAnyEntry(namespace: string): Promise<boolean> {
        const modelId = getModelIdFromAppName(namespace);
        if (!modelId) {
            return false;
        }
        const model = await this.getModel.execute(modelId);
        if (model.isFail()) {
            if (UNREADABLE_CODES.includes(model.error.code)) {
                return false;
            }
            throw model.error;
        }
        if (model.value.isPrivate) {
            return false;
        }
        const group = await this.getGroup.execute(model.value.group);
        if (group.isFail()) {
            if (UNREADABLE_CODES.includes(group.error.code)) {
                return false;
            }
            throw group.error;
        }
        if (!(await this.accessControl.canAccessGroup({ group: group.value }))) {
            return false;
        }
        if (!(await this.accessControl.canAccessModel({ model: model.value }))) {
            return false;
        }
        return this.accessControl.canAccessEntry({ model: model.value, rwd: "d" });
    }
}

export const CmsEntryAccess = Abstraction.createImplementation({
    implementation: CmsEntryAccessImpl,
    dependencies: [AccessControl, GetModelUseCase, GetGroupUseCase, FolderLevelPermissions]
});
