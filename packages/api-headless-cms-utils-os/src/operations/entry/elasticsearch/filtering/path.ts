import type { ModelField } from "~/operations/entry/elasticsearch/types.js";
import type { CmsEntryOpenSearchValueSearchRegistry } from "~/features/CmsEntryOpenSearchValueSearch/index.js";

interface FieldPathFactoryParams {
    valueSearchRegistry: CmsEntryOpenSearchValueSearchRegistry.Interface;
}
interface FieldPathParams {
    field: ModelField;
    key: string;
    value: any;
    originalValue: any;
    keyword: boolean;
}

export const createFieldPathFactory = ({ valueSearchRegistry }: FieldPathFactoryParams) => {
    return (params: FieldPathParams) => {
        const { field, key, value, keyword, originalValue } = params;
        const search = valueSearchRegistry.get(field.type);

        let fieldPath: string | null = null;
        if (search) {
            fieldPath = search.createPath({ field: field.field, value, key, originalValue });
        }
        if (!fieldPath) {
            fieldPath = field.field.storageId;
            if (field.path) {
                fieldPath = typeof field.path === "function" ? field.path(value) : field.path;
            }
        }

        const result: string[] = field.parents.map(p => p.storageId).concat([fieldPath]);

        return {
            basePath: result.join("."),
            path: result.concat(keyword ? ["keyword"] : []).join(".")
        };
    };
};
