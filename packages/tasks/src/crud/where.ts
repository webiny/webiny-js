import type { CmsEntryListWhere, CmsModelField } from "@webiny/api-headless-cms/types/index.js";
import type { GenericRecord } from "@webiny/api/types.js";

interface IRemapWhereParams {
    where?: GenericRecord;
    fields: CmsModelField[];
}

export const remapWhere = (params: IRemapWhereParams): CmsEntryListWhere | undefined => {
    const { where, fields } = params;
    if (!where) {
        return undefined;
    }
    const fieldIdList = fields.map(f => f.fieldId);

    const result: CmsEntryListWhere = {};
    for (const whereKey in where) {
        const key = whereKey as unknown as keyof typeof result;

        const field = key.split("_")[0];
        const value = where[key];
        if (fieldIdList.includes(field)) {
            result.values = {
                ...result.values,
                [key]: value
            };
            continue;
        }
        result[key] = value;
    }
    return result;
};
