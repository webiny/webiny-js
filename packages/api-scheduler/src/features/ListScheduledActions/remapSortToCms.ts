import type { CmsEntryListSort, CmsModelField } from "@webiny/api-headless-cms/types/index.js";

interface IRemapSortToCmsParams {
    input: CmsEntryListSort | undefined;
    fields: Pick<CmsModelField, "fieldId">[];
}

export const remapSortToCms = (params: IRemapSortToCmsParams): CmsEntryListSort | undefined => {
    const { input, fields } = params;
    if (!input?.length) {
        return undefined;
    }
    const result: CmsEntryListSort = [];
    for (const item of input) {
        const field = item.split("_");
        /**
         * Each sort item must consist of exactly two parts: fieldId and direction (ASC or DESC).
         * If there is less or more, just skip parsing and add the item.
         */
        if (field?.length !== 2) {
            result.push(item);
            continue;
        }
        const [fieldId] = field;
        // Check if the field exists in the model fields
        const fieldExists = fields.some(f => f.fieldId === fieldId);
        if (!fieldExists) {
            continue;
        }
        result.push(`values_${item}`);
    }
    return result;
};
