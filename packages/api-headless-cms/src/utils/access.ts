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
    const { groups } = context.cms.permissions;

    return groups.canAccessGroup({
        group
    });
};

export const validateModelAccess = async (
    context: PickedCmsContext,
    model: PickedCmsModel
): Promise<boolean> => {
    const { models } = context.cms.permissions;
    return models.canAccessModel({
        model
    });
};
