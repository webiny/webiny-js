import { NotAuthorizedError } from "@webiny/api-security";
import { CmsContext, CmsGroup, CmsGroupPermission, CmsModel, CmsModelPermission } from "~/types";
import { checkPermissions } from "./checkPermissions";

export const validateGroupAccess = (
    context: CmsContext,
    permissions: CmsGroupPermission[],
    group: CmsGroup
) => {
    for (let i = 0; i < permissions.length; i++) {
        const permission = permissions[i];
        const { groups } = permission;
        // when no groups defined on permission
        // it means user has access to everything
        if (!groups) {
            return true;
        }
        const locale = context.cms.getLocale().code;
        // when there is no locale in groups, it means that no access was given
        // this happens when access control was set but no models or groups were added
        if (
            Array.isArray(groups[locale]) === false ||
            groups[locale].includes(group.id) === false
        ) {
            return false;
        }
        return true;
    }

    return false;
};

export const validateModelAccess = async (
    context: CmsContext,
    model: CmsModel
): Promise<boolean> => {
    const modelGroupPermissions: CmsGroupPermission[] = await checkPermissions(
        context,
        "cms.contentModelGroup",
        { rwd: "r" }
    );

    for (let i = 0; i < modelGroupPermissions.length; i++) {
        const modelGroupPermission = modelGroupPermissions[i];

        const { groups } = modelGroupPermission;

        const modelPermissions: CmsModelPermission[] = await checkPermissions(
            context,
            "cms.contentModel",
            {
                rwd: "r"
            }
        );

        for (let j = 0; j < modelPermissions.length; j++) {
            const modelPermission = modelPermissions[j];

            const { models } = modelPermission;
            // when no models or groups defined on permission
            // it means user has access to everything
            if (!models && !groups) {
                return true;
            }

            const locale = context.cms.getLocale().code;

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
};

/**
 * model access is checking for both specific model or group access
 * if permission has specific models set as access pattern then groups will not matter (although both can be set)
 */
export const checkModelAccess = async (context: CmsContext, model: CmsModel): Promise<void> => {
    if (await validateModelAccess(context, model)) {
        return;
    }
    throw new NotAuthorizedError({
        data: {
            reason: `Not allowed to access model "${model.modelId}".`
        }
    });
};
