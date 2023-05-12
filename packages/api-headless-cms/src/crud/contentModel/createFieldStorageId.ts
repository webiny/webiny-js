import { CmsModelField } from "~/types";
import { getBaseFieldType } from "~/utils/getBaseFieldType";

export const createFieldStorageId = (params: Pick<CmsModelField, "id" | "type">): string => {
    const { type, id } = params;
    return `${getBaseFieldType({ type })}@${id}`;
};
