import { NotAuthorizedError } from "@webiny/api-security";
import { CmsContext, CmsGroup, CmsGroupPermission, CmsModel, CmsModelPermission } from "~/types";
import { checkPermissions } from "./permissions";

export const validateGroupAccess = (
    context: CmsContext,
    permission: CmsGroupPermission,
    group: CmsGroup
): boolean => {
    const { groups } = permission;
    // when no groups defined on permission
    // it means user has access to everything
    if (!groups) {
        return true;
    }
    const locale = context.cms.getLocale().code;
    // when there is no locale in groups, it means that no access was given
    // this happens when access control was set but no models or groups were added
    if (Array.isArray(groups[locale]) === false || groups[locale].includes(group.id) === false) {
        return false;
    }
    return true;
};

export const validateModelAccess = async (
    context: CmsContext,
    model: CmsModel
): Promise<boolean> => {
    const modelGroupPermission: CmsGroupPermission = await checkPermissions(
        context,
        "cms.contentModelGroup",
        { rwd: "r" }
    );
    const { groups } = modelGroupPermission;

    const modelPermission: CmsModelPermission = await checkPermissions(
        context,
        "cms.contentModel",
        {
            rwd: "r"
        }
    );
    const { models } = modelPermission;
    // when no models or groups defined on permission
    // it means user has access to everything
    if (!models && !groups) {
        return true;
    }
    const locale = context.cms.getLocale().code;
    // Check whether the model is question belongs to "content model groups" for which user has permission.
    if (groups) {
        if (
            Array.isArray(groups[locale]) === false ||
            groups[locale].includes(model.group.id) === false
        ) {
            return false;
        }
    }
    // Check whether the model is question belongs to "content models" for which user has permission.
    if (models) {
        if (
            Array.isArray(models[locale]) === false ||
            models[locale].includes(model.modelId) === false
        ) {
            return false;
        }
    }

    return true;
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
