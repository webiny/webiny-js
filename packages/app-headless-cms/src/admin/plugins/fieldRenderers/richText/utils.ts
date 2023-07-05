import { CmsModel, CmsModelField } from "@webiny/app-headless-cms-common/types";

/*
 * Model have at least one single/multiple legacy RTE field
 * */
export const modelHasLegacyRteField = (model: CmsModel): boolean => {
    return model.fields.some(
        field =>
            field.renderer.name === "rich-text-inputs" || field.renderer.name === "rich-text-input"
    );
};

/*
 * Check id field is legacy RTE
 * */
export const isLegacyRteField = (field: CmsModelField): boolean => {
    return field.renderer.name === "rich-text-input" || field.renderer.name === "rich-text-inputs";
};

/*
 * Checks if the field is saved as legacy RTE
 * */
export const isLegacyRteFieldSaved = (field: CmsModelField): boolean => {
    return !!field.id && isLegacyRteField(field);
};
