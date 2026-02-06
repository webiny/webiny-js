import type { CmsModelDynamicZoneField, CmsModelField } from "~/types/index.js";
import camelCase from "lodash/camelCase";

export type BaseCmsModelField =
    | (Partial<CmsModelDynamicZoneField> & Pick<CmsModelDynamicZoneField, "fieldId" | "type">)
    | (Partial<CmsModelField> & Pick<CmsModelField, "fieldId" | "type">);

export const createModelField = (base: BaseCmsModelField): CmsModelField => {
    const { fieldId, type } = base;
    const id = base.id || `${fieldId}Id`;
    return {
        settings: {},
        ...base,
        id,
        fieldId,
        type,
        validation: [],
        listValidation: [],
        label: camelCase(fieldId),
        storageId: `${type}@${id}`
    };
};
