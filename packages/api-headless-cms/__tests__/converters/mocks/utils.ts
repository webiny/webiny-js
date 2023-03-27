import lodashCamelCase from "lodash/camelCase";
import { CmsModelDynamicZoneField, CmsModelField } from "~/types";

type BaseCmsModelField =
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
        label: lodashCamelCase(fieldId),
        storageId: `${type}@${id}`
    };
};
