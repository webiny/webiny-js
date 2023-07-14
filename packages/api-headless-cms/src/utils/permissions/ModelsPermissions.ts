import { AppPermissions, AppPermissionsParams, NotAuthorizedError } from "@webiny/api-security";
import { CmsGroupPermission, CmsModel, CmsModelPermission } from "~/types";
import { ModelGroupsPermissions } from "~/utils/permissions/ModelGroupsPermissions";

export interface ModelsPermissionsParams extends AppPermissionsParams<CmsGroupPermission> {
    modelGroupsPermissions: ModelGroupsPermissions;
}

export interface CanAccessModelParams {
    model: CmsModel;
    locale: string;
}

export interface EnsureModelAccessParams {
    model: CmsModel;
    locale: string;
}

export class ModelsPermissions extends AppPermissions<CmsModelPermission> {
    private modelGroupsPermissions: ModelGroupsPermissions;

    constructor(params: ModelsPermissionsParams) {
        super(params);
        this.modelGroupsPermissions = params.modelGroupsPermissions;
    }

    async canAccessModel({ model, locale }: CanAccessModelParams) {
        if (await this.hasFullAccess()) {
            return true;
        }

        const modelGroupsPermissions = this.modelGroupsPermissions;

        // eslint-disable-next-line
        const modelsPermissions = this;

        const canReadGroups = await modelGroupsPermissions.ensure({ rwd: "r" }, { throw: false });
        if (!canReadGroups) {
            return false;
        }

        const canReadModels = await modelsPermissions.ensure({ rwd: "r" }, { throw: false });
        if (!canReadModels) {
            return false;
        }

        const modelGroupsPermissionsList = await modelGroupsPermissions.getPermissions();
        const modelsPermissionsList = await this.getPermissions();

        for (let i = 0; i < modelGroupsPermissionsList.length; i++) {
            const modelGroupPermission = modelGroupsPermissionsList[i];

            const { groups } = modelGroupPermission;

            for (let j = 0; j < modelsPermissionsList.length; j++) {
                const modelPermission = modelsPermissionsList[j];

                const { models } = modelPermission;
                // when no models or groups defined on permission
                // it means user has access to everything
                if (!models && !groups) {
                    return true;
                }

                // Does the model belong to a group for which user has permission?
                if (groups) {
                    if (
                        Array.isArray(groups[locale]) === false ||
                        groups[locale].includes(model.group.id) === false
                    ) {
                        continue;
                    }
                }

                // Does the user have access to the specific model?
                if (models) {
                    if (
                        Array.isArray(models[locale]) === false ||
                        models[locale].includes(model.modelId) === false
                    ) {
                        continue;
                    }
                }

                return true;
            }
        }

        return false;
    }

    async ensureCanAccessModel(params: EnsureModelAccessParams) {
        const canAccessModel = await this.canAccessModel(params);
        if (canAccessModel) {
            return;
        }

        throw new NotAuthorizedError({
            data: {
                reason: `Not allowed to access model "${params.model.modelId}".`
            }
        });
    }
}
