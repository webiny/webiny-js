import type { CmsModelField } from "~/types/index.js";

export const getApplicableFieldById = (
    fields: CmsModelField[],
    id: string | null | undefined,
    isApplicable: (field: CmsModelField) => boolean
) => {
    if (!id) {
        return undefined;
    }

    return fields.find(field => field.fieldId === id && isApplicable(field));
};
