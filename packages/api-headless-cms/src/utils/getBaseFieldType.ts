import type { CmsModelField } from "~/types/index.js";

export const getBaseFieldType = (field: Pick<CmsModelField, "type">) => {
    if (field.type.includes(":") === false) {
        return field.type;
    }
    return field.type.split(":")[0];
};
