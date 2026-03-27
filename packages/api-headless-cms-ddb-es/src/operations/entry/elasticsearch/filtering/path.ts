import type {
    OpenSearchQuerySearchValuePlugins,
    ModelField
} from "~/operations/entry/elasticsearch/types.js";
import { getBaseFieldType } from "@webiny/api-headless-cms/utils/getBaseFieldType.js";

interface FieldPathFactoryParams {
    plugins: OpenSearchQuerySearchValuePlugins;
}
interface FieldPathParams {
    field: ModelField;
    key: string;
    value: any;
    originalValue: any;
    keyword: boolean;
}

export const createFieldPathFactory = ({ plugins }: FieldPathFactoryParams) => {
    return (params: FieldPathParams) => {
        const { field, key, value, keyword, originalValue } = params;
        const fieldType = getBaseFieldType(field);
        const plugin = plugins[fieldType];

        let fieldPath: string | null = null;
        if (plugin) {
            fieldPath = plugin.createPath({ field: field.field, value, key, originalValue });
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
