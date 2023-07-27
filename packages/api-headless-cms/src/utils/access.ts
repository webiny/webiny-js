import { CmsContext, CmsGroup, CmsModel } from "~/types";

interface PickedCmsContext {
    cms: Pick<CmsContext["cms"], "permissions">;
}

type PickedCmsGroup = Pick<CmsGroup, "id" | "locale">;
type PickedCmsModel = Pick<CmsModel, "modelId" | "locale" | "group">;

export const validateGroupAccess = async (
    context: PickedCmsContext,
    group: PickedCmsGroup
): Promise<boolean> => {
    const { modelGroupsPermissions } = context.cms.permissions;

    return modelGroupsPermissions.canAccessGroup({
        group
    });
};

export const validateModelAccess = async (
    context: PickedCmsContext,
    model: PickedCmsModel
): Promise<boolean> => {
    const { modelsPermissions } = context.cms.permissions;
    return modelsPermissions.canAccessModel({
        model
    });
};

export const checkModelAccess = async (
    context: PickedCmsContext,
    model: PickedCmsModel
): Promise<void> => {
    const { modelsPermissions } = context.cms.permissions;

    await modelsPermissions.ensureCanAccessModel({
        model
    });
};
