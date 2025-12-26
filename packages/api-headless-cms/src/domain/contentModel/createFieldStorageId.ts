import type { CmsModelField } from "~/types/index.js";
import { getBaseFieldType } from "~/utils/getBaseFieldType.js";

export const createFieldStorageId = (params: Pick<CmsModelField, "id" | "type">): string => {
    const { type, id } = params;
    return `${getBaseFieldType({ type })}@${id}`;
};
