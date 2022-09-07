import { CmsModelField } from "~/types";

export const createFieldStorageId = (params: Pick<CmsModelField, "id" | "type">): string => {
    const { type, id } = params;
    return `${type}@${id}`;
};
