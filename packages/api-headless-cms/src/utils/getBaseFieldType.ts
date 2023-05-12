import { CmsModelField } from "~/types";

export const getBaseFieldType = (field: Pick<CmsModelField, "type">) => {
    return field.type.split(":")[0];
};
