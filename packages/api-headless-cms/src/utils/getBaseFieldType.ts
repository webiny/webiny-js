import { CmsModelField } from "~/types";

export const getBaseFieldType = (field: { type: CmsModelField["type"] }) => {
    return field.type.split(":")[0];
};
