import { AppPermissionsParams, NotAuthorizedError } from "@webiny/api-security";
import { CmsGroupPermission, CmsModel, CmsGroup, CmsModelPermission } from "~/types";
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
    getModelGroup: (id: string) => Promise<CmsGroup>;
    fullAccessPermissionName?: string;
    modelGroupsPermissions: ModelGroupsPermissions;
}

interface HasFullAccessParams {
    model: CmsModel;
}

interface AccessControlEntry {
    rwd: string;
    canAccessNonOwnedModels: boolean;
    canAccessOnlyOwnedModels: boolean;
}

type AccessControlList = AccessControlEntry[];

export class ModelsPermissions {
    getIdentity: () => SecurityIdentity | Promise<SecurityIdentity>;
    getPermissions: () => CmsModelPermission[] | Promise<CmsModelPermission[]>;
    getModelGroup: (id: string) => Promise<CmsGroup>;
    private fullAccessPermissions: string[];
    private readonly modelGroupsPermissions: ModelGroupsPermissions;

    constructor({
        getIdentity,
        getPermissions,
        modelGroupsPermissions,
        getModelGroup
    }: ModelsPermissionsParams) {
        this.getIdentity = getIdentity;
        this.getPermissions = getPermissions;
        this.getModelGroup = getModelGroup;
        this.fullAccessPermissions = ["*", "cms.*"];
        this.modelGroupsPermissions = modelGroupsPermissions;
    }

    async canAccessModel(params: EnsureParams): Promise<boolean> {
        const acl = await this.getAccessControlList(params);

        // If we don't even have read access, we can't proceed. This is the first check
        // we need to make, because it will prevent us from proceeding with other checks.
        const canReadModel = acl.find(entry => entry.rwd?.includes("r"));
        if (!canReadModel) {
            return false;
        }

        if (params.rwd) {
            const hasRwd = acl.find(({ rwd }) => rwd.includes("r"));
            if (!hasRwd) {
                return false;
            }
        }

        return true;
    }

    async ensureCanAccessModel(params: EnsureParams) {
        const canAccess = await this.canAccessModel(params);
        if (!canAccess) {
            throw new NotAuthorizedError({
                data: {
                    reason: `Not allowed to access model "${params.model.modelId}".`
                }
            });
        }
    }

    private async getAccessControlList(params: EnsureParams): Promise<AccessControlList> {
        const hasFullAccess = await this.hasFullAccess(params);
        if (hasFullAccess) {
            return [{ rwd: "rwd", canAccessNonOwnedModels: true, canAccessOnlyOwnedModels: false }];
        }

        // Check if user can access model group.
        const modelGroupsPermissionsList = await this.modelGroupsPermissions.getPermissions();
        const modelsPermissionsList = await this.getPermissions();

        const { model } = params;
        const { locale } = model;

        let modelGroup: CmsGroup;
        const getModelGroup = async () => {
            if (!modelGroup) {
                modelGroup = await this.getModelGroup(model.group.id);
            }
            return modelGroup;
        };

        const acl: AccessControlList = [];

        for (let i = 0; i < modelGroupsPermissionsList.length; i++) {
            const modelGroupPermission = modelGroupsPermissionsList[i];

            // 1. Group permissions granting access to all groups the user created?
            // When selected, that means the user can perform all actions on not only
            // the groups they created, but also on all models and all content entries
            // within those groups. The only exception are the publish / unpublish actions
            // on content entries, which still need to be set on content entries permission.
            if (modelGroupPermission.own) {
                const currentModelGroup = await getModelGroup();
                if (!currentModelGroup) {
                    continue;
                }

                const modelGroupCreatedBy = currentModelGroup.createdBy;
                if (!modelGroupCreatedBy) {
                    continue;
                }

                const identity = await this.getIdentity();
                if (modelGroupCreatedBy.id !== identity.id) {
                    continue;
                }

                acl.push({
                    rwd: "rwd",
                    canAccessNonOwnedModels: false,
                    canAccessOnlyOwnedModels: true
                });

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
                    continue;
                }

                if (!groups[locale].includes(model.group.id)) {
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
            // because they are not related to current group permissions. We're using the
            // `_src` property to link the model permissions to the group permissions.
            // ---
            const relatedModelPermissions = modelsPermissionsList.find(
                permissions => permissions._src === modelGroupPermission._src
            );

            if (!relatedModelPermissions) {
                continue;
            }

            // Check if the permissions object grants full access to all models (doesn't set any restrictions).
            const fullAccess =
                !relatedModelPermissions.rwd &&
                !relatedModelPermissions.own &&
                !relatedModelPermissions.models;
            if (fullAccess) {
                acl.push({
                    rwd: "rwd",
                    canAccessNonOwnedModels: true,
                    canAccessOnlyOwnedModels: false
                });

                continue;
            }

            // 1. Model permissions granting access to all models the user created?
            if (relatedModelPermissions.own) {
                const modelCreatedBy = model.createdBy;
                if (!modelCreatedBy) {
                    continue;
                }

                const identity = await this.getIdentity();
                if (modelCreatedBy.id !== identity.id) {
                    continue;
                }

                acl.push({
                    rwd: "rwd",
                    canAccessNonOwnedModels: false,
                    canAccessOnlyOwnedModels: true
                });

                continue;
            }

            // 2. Model permission granting access to specific models?
            if (relatedModelPermissions.models) {
                const { models } = relatedModelPermissions;

                if (!Array.isArray(models[locale])) {
                    continue;
                }

                if (!models[locale].includes(params.model.modelId)) {
                    continue;
                }
            }

            // If we got here, that means the model either belongs to a group the user
            // has access to, or, the user has access to all groups.
            acl.push({
                rwd: relatedModelPermissions.rwd as string,
                canAccessNonOwnedModels: true,
                canAccessOnlyOwnedModels: false
            });
        }

        return acl;
    }

    private async hasFullAccess(params: HasFullAccessParams) {
        // Authorization disabled on model level?
        if ("authorization" in params.model) {
            const { authorization } = params.model;
            if (typeof authorization === "boolean") {
                return authorization === false;
            }

            return authorization?.permissions === false;
        }

        const permissions = await this.getPermissions();
        return permissions.some(p => this.fullAccessPermissions.filter(Boolean).includes(p.name));
    }
}
