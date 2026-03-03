import type { CmsModelField } from "@webiny/api-headless-cms/types/index.js";
import { createModelField } from "@webiny/api-headless-cms";

type PartialCmsModelField = Partial<CmsModelField> &
    Pick<CmsModelField, "storageId" | "fieldId" | "type">;
export const createSystemField = (field: PartialCmsModelField): CmsModelField => {
    return createModelField({
        ...field,
        id: field.fieldId,
        label: field.fieldId
    });
};
