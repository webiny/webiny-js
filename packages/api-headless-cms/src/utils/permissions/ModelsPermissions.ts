import { AppPermissionsParams, NotAuthorizedError } from "@webiny/api-security";
import { CmsGroupPermission, CmsModel, CmsModelPermission } from "~/types";
import { ModelGroupsPermissions } from "~/utils/permissions/ModelGroupsPermissions";
import { CreatedBy, SecurityIdentity } from "@webiny/api-security/types";

interface EnsureParams {
    model: CmsModel;
    rwd?: string;
    owns?: CreatedBy;
    canCreate?: boolean;
}

export interface ModelsPermissionsParams extends AppPermissionsParams<CmsGroupPermission> {
    modelGroupsPermissions: ModelGroupsPermissions;
}

export interface ModelsPermissionsParams {
    getIdentity: () => SecurityIdentity | Promise<SecurityIdentity>;
    getPermissions: () => CmsModelPermission[] | Promise<CmsModelPermission[]>;
    fullAccessPermissionName?: string;
    modelGroupsPermissions: ModelGroupsPermissions;
}

interface HasFullAccessParams {
    model: CmsModel;
}

export class ModelsPermissions {
    getIdentity: () => SecurityIdentity | Promise<SecurityIdentity>;
    getPermissions: () => CmsModelPermission[] | Promise<CmsModelPermission[]>;
    private fullAccessPermissions: string[];
    private readonly modelGroupsPermissions: ModelGroupsPermissions;

    constructor({ getIdentity, getPermissions, modelGroupsPermissions }: ModelsPermissionsParams) {
        this.getIdentity = getIdentity;
        this.getPermissions = getPermissions;
        this.fullAccessPermissions = ["*", "cms.*"];
        this.modelGroupsPermissions = modelGroupsPermissions;
    }

    async canAccess(params: EnsureParams): Promise<boolean> {
        const hasFullAccess = await this.hasFullAccess(params);
        if (hasFullAccess) {
            return true;
        }

        const modelGroupsPermissionsList = await this.modelGroupsPermissions.getPermissions();
        const modelsPermissionsList = await this.getPermissions();

        const { model } = params;
        const { locale } = model;

        let finalModelPermissions = { rwd: "", onlyOwn: false };

        for (let i = 0; i < modelGroupsPermissionsList.length; i++) {
            const modelGroupPermission = modelGroupsPermissionsList[i];

            // 1. Group permissions granting access to all groups the user created?
            // When selected, that means the user can perform all actions on not only
            // the groups they created, but also on all models and all content entries
            // within those groups. The only exception are the publish / unpublish actions
            // on content entries, which still need to be set on content entries permission.
            if (modelGroupPermission.own) {
                const modelGroupCreatedBy = { id: "LOAD-THIS?" };

                if (modelGroupCreatedBy) {
                    const identity = await this.getIdentity();
                    if (modelGroupCreatedBy.id === identity.id) {
                        finalModelPermissions = { rwd: "rwd", onlyOwn: true };
                        break;
                    }
                }

                // Continue examining the next group.
                continue;
            }

            // 2. Group permissions granting access specific groups?
            // When selected, that means the user can perform all actions on all models
            // and all entries within the selected groups. But, unlike the previous permission,
            // this one doesn't give full access to all models and content entries. The user
            // must define what permissions they have on models and entries.
            if (modelGroupPermission.groups) {
                const { groups } = modelGroupPermission;

                if (!Array.isArray(groups[locale])) {
                    // Continue examining the next group.
                    continue;
                }

                if (!groups[locale].includes(model.group.id)) {
                    // Continue examining the next group.
                    continue;
                }
            }

            // If we got here, that means the model either belongs to a group the user
            // has access to, or, the user has access to all groups. In both cases, we
            // need to check the related model permissions.

            // The following note is important for when the Teams feature is enabled,
            // and where users can be linked to multiple roles, some of which contain
            // their own CMS permissions.
            // ---
            // We're only checking one model permissions object!
            // This is because model permissions are always related to group permissions.
            // We don't care about potentially other model permissions that might exist,
            // because they are not related to current group permissions. At the moment,
            // we're retrieving the relevant model permissions object based on the index
            // of the current group permissions object. This is because the order of group
            // permissions and model permissions is the same. In the future, we may need
            // to improve this, but for now, this is the way it works.
            // ---
            const relatedModelPermissions = modelsPermissionsList[i];

            // 1. Model permissions granting access to all models the user created?
            if (relatedModelPermissions.own) {
                const modelCreatedBy = model.createdBy;
                if (modelCreatedBy) {
                    const identity = await this.getIdentity();
                    if (modelCreatedBy.id === identity.id) {
                        finalModelPermissions = { rwd: "rwd", onlyOwn: true };
                        break;
                    }
                }

                // Continue examining the next group.
                continue;
            }

            // 2. Model permission granting access to specific models?
            if (relatedModelPermissions.models) {
                const { models } = relatedModelPermissions;

                if (!Array.isArray(models[locale])) {
                    // Continue examining the next group.
                    continue;
                }

                if (!models[locale].includes(params.model.modelId)) {
                    // Continue examining the next group.
                    continue;
                }
            }

            // If we got here, that means the model either belongs to a group the user
            // has access to, or, the user has access to all groups.
            finalModelPermissions = {
                rwd: relatedModelPermissions.rwd as string,
                onlyOwn: false
            };

            // If we don't even have read access, we can't proceed. This is the first check
            // we need to make, because it will prevent us from proceeding with other checks.
            if (!finalModelPermissions.rwd.includes("r")) {
                // Continue examining the next group.
                continue;
            }

            if (params.owns) {
                if (finalModelPermissions.onlyOwn) {
                    const identity = await this.getIdentity();
                    if (identity.id !== params.owns.id) {
                        // Continue examining the next group.
                        continue;
                    }
                }
            }

            if (params.rwd) {
                if (params.rwd === "c") {
                    // 'c' is a special case, because it's not a part of the `rwd` string.
                    // It's used to examine whether the user can create new models.
                    // This is not the case if a user can only access their own models.
                    if (finalModelPermissions.onlyOwn) {
                        // Continue examining the next group.
                        continue;
                    }
                } else {
                    if (!finalModelPermissions.rwd.includes(params.rwd)) {
                        // Continue examining the next group.
                        continue;
                    }
                }
            }

            // If we made it here, that means the current group permissions and model permissions
            // allow the user to access the requested model and perform the requested action.
            return true;
        }

        return false;
    }

    async ensureCanAccess(params: EnsureParams) {
        const canAccessFolderContent = await this.canAccess(params);
        if (!canAccessFolderContent) {
            throw new NotAuthorizedError();
        }
    }

    private async hasFullAccess(params: HasFullAccessParams) {
        if (params.model.authorization === false) {
            return true;
        }

        const permissions = await this.getPermissions();
        return permissions.some(p => this.fullAccessPermissions.filter(Boolean).includes(p.name));
    }
}
