import { AccessControl } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { GetGroupUseCase } from "@webiny/api-headless-cms/features/contentModelGroup/GetGroup/index.js";
import { FolderLevelPermissions } from "@webiny/api-aco/features/flp/FolderLevelPermissions/index.js";
import { getModelIdFromAppName } from "~/utils/appName.js";
import type { CmsEntryTarget } from "../CmsEntryTargetReader/abstractions.js";
import { canAccessEntryFolder, type EntryFolderRwd } from "../canAccessEntryFolder.js";
import { CmsEntryAccess as Abstraction } from "./abstractions.js";

const UNREADABLE_CODES = [
    "Cms/Model/NotFound",
    "Cms/Model/NotAuthorized",
    "Cms/ModelGroup/NotFound",
    "Cms/ModelGroup/NotAuthorized"
];

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

    public canRead(target: CmsEntryTarget): Promise<boolean> {
        return this.can(target, "r");
    }

    public canWrite(target: CmsEntryTarget): Promise<boolean> {
        return this.can(target, "w");
    }

    public canDelete(target: CmsEntryTarget): Promise<boolean> {
        return this.can(target, "d");
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

    private async can(target: CmsEntryTarget, rwd: EntryFolderRwd): Promise<boolean> {
        if (!(await this.accessControl.canAccessGroup({ group: target.group }))) {
            return false;
        }
        if (!(await this.accessControl.canAccessModel({ model: target.model }))) {
            return false;
        }
        const canAccessEntry = await this.accessControl.canAccessEntry({
            model: target.model,
            entry: target.entry,
            rwd
        });
        if (!canAccessEntry) {
            return false;
        }
        return canAccessEntryFolder(
            this.folderLevelPermissions,
            target.entry.location?.folderId,
            rwd
        );
    }
}

export const CmsEntryAccess = Abstraction.createImplementation({
    implementation: CmsEntryAccessImpl,
    dependencies: [AccessControl, GetModelUseCase, GetGroupUseCase, FolderLevelPermissions]
});
