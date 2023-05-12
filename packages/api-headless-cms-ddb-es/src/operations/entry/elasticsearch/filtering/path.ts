import {
    ElasticsearchQuerySearchValuePlugins,
    ModelField
} from "~/operations/entry/elasticsearch/types";

interface FieldPathFactoryParams {
    plugins: ElasticsearchQuerySearchValuePlugins;
}
interface FieldPathParams {
    field: ModelField;
    key: string;
    value: any;
    keyword: boolean;
}

export const createFieldPathFactory = ({ plugins }: FieldPathFactoryParams) => {
    return (params: FieldPathParams) => {
        const { field, key, value, keyword } = params;
        const plugin = plugins[field.type];

        let fieldPath: string | null = null;
        if (plugin) {
            fieldPath = plugin.createPath({ field: field.field, value, key });
        }
        if (!fieldPath) {
            fieldPath = field.field.storageId;
            if (field.path) {
                fieldPath = typeof field.path === "function" ? field.path(value) : field.path;
            }
        }

        const result: string[] = [];
        if (!field.systemField) {
            result.push("values");
        }
        result.push(...field.parents.map(p => p.storageId));
        result.push(fieldPath);

        return {
            basePath: result.join("."),
            path: result.concat(keyword ? ["keyword"] : []).join(".")
        };
    };
};
