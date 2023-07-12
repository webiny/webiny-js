import { CmsModel, CmsModelField } from "@webiny/app-headless-cms-common/types";

/**
 * Model have at least one single/multiple legacy RTE field
 */
export const modelHasLegacyRteField = (model: CmsModel): boolean => {
    return model.fields.some(field => field.renderer.name.startsWith("rich-text-"));
};

/**
 * Check id field is legacy RTE
 */
export const isLegacyRteField = (field: CmsModelField): boolean => {
    return field.renderer.name.startsWith("rich-text-");
};

/**
 * Checks if the field is saved as legacy RTE
 */
export const isLegacyRteFieldSaved = (field: CmsModelField): boolean => {
    return !!field.id && isLegacyRteField(field);
};
