import { AppPermissions, AppPermissionsParams, NotAuthorizedError } from "@webiny/api-security";
import {
    CmsGroupPermission,
    CmsModel as BaseCmsModel,
    CmsModelGroup as BaseCmsModelGroup,
    CmsModelPermission
} from "~/types";
import { ModelGroupsPermissions } from "~/utils/permissions/ModelGroupsPermissions";

export interface ModelsPermissionsParams extends AppPermissionsParams<CmsGroupPermission> {
    modelGroupsPermissions: ModelGroupsPermissions;
}

interface PickedCmsModel extends Pick<BaseCmsModel, "modelId" | "locale"> {
    group: Pick<BaseCmsModelGroup, "id">;
}

export interface CanAccessModelParams {
    model: PickedCmsModel;
}

export interface EnsureModelAccessParams {
    model: PickedCmsModel;
}

export class ModelsPermissions extends AppPermissions<CmsModelPermission> {
    private readonly modelGroupsPermissions: ModelGroupsPermissions;

    public constructor(params: ModelsPermissionsParams) {
        super(params);
        this.modelGroupsPermissions = params.modelGroupsPermissions;
    }

    public async canAccessModel({ model }: CanAccessModelParams) {
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

        const locale = model.locale;

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

    public async ensureCanAccessModel(params: EnsureModelAccessParams) {
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
