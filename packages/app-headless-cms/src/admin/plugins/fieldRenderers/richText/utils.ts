import { CmsModel, CmsModelField } from "@webiny/app-headless-cms-common/types";

export const modelHasLegacyRteField = (model: CmsModel): boolean => {
    return model.fields.some(isLegacyRteField);
};

export const isLegacyRteField = (field: CmsModelField): boolean => {
    return field.renderer.name.startsWith("rich-text-");
};

export const isLegacyRteFieldSaved = (field: CmsModelField): boolean => {
    return !!field.id && isLegacyRteField(field);
};
