import WebinyError from "@webiny/error";
import { ElasticsearchBoolQueryConfig } from "@webiny/api-elasticsearch/types";
import { parseWhereKey } from "@webiny/api-elasticsearch";
import { CmsEntryElasticsearchQueryBuilderValueSearchPlugin } from "~/plugins";
import { hasKeyword } from "./keyword";
import { CmsEntryListWhere } from "@webiny/api-headless-cms/types";
import { createBaseQuery } from "./initialQuery";
import {
    ElasticsearchQueryBuilderOperatorPlugins,
    ElasticsearchQuerySearchValuePlugins,
    ModelField,
    ModelFields
} from "./types";
import { isRefFieldFiltering } from "./isRefFieldFiltering";
import { PluginsContainer } from "@webiny/plugins";
import { transformValueForSearch } from "./transformValueForSearch";

interface FieldPathFactoryParams {
    plugins: Record<string, CmsEntryElasticsearchQueryBuilderValueSearchPlugin>;
}
interface FieldPathParams {
    modelField: ModelField;
    key: string;
    parentPath?: string | null;
    keyword?: boolean;
    value: any;
}
const createFieldPathFactory = ({ plugins }: FieldPathFactoryParams) => {
    return (params: FieldPathParams) => {
        const { modelField, key, parentPath, keyword, value } = params;
        const plugin = plugins[modelField.type];

        const field = modelField.field;

        let fieldPath: string | null = null;
        if (plugin) {
            fieldPath = plugin.createPath({ field, value, key });
        }
        if (!fieldPath) {
            fieldPath = field.storageId;
            if (modelField.path) {
                fieldPath =
                    typeof modelField.path === "function"
                        ? modelField.path(value)
                        : modelField.path;
            }
        }

        const result: string[] = [];
        if (parentPath) {
            result.push(parentPath);
        }
        result.push(fieldPath);

        if (keyword) {
            result.push("keyword");
        }
        return result.join(".");
    };
};
/*
interface CreateApplyFilteringParams {
    query: ElasticsearchBoolQueryConfig;
    operatorPlugins: Record<string, ElasticsearchQueryBuilderOperatorPlugin>;
    searchPlugins: Record<string, CmsEntryElasticsearchQueryBuilderValueSearchPlugin>;
}

export const createApplyFiltering = ({
    searchPlugins,
    operatorPlugins,
    query
}: CreateApplyFilteringParams) => {
    const createFieldPath = createFieldPathFactory({
        plugins: searchPlugins
    });

    return (params: CbParams) => {
        const { modelField, operator, key, value: initialValue } = params;
        const plugin = operatorPlugins[operator];
        if (!plugin) {
            throw new WebinyError("Operator plugin missing.", "PLUGIN_MISSING", {
                operator
            });
        }
        const value = transformValueForSearch({
            plugins: searchPlugins,
            field: modelField.field,
            value: initialValue
        });

        const keyword = hasKeyword(modelField);
        plugin.apply(query, {
            basePath: createFieldPath({
                modelField,
                parentPath: modelField.isSystemField ? null : "values",
                value,
                key
            }),
            path: createFieldPath({
                modelField,
                value,
                parentPath: modelField.isSystemField ? null : "values",
                keyword,
                key
            }),
            value,
            keyword
        });
    };
};

*/

const getValues = (value: unknown, condition: "AND" | "OR") => {
    const values = value as CmsEntryListWhere[] | undefined;
    if (!Array.isArray(values)) {
        throw new WebinyError(
            `Trying to run filtering with "${condition}", but the value sent is not an array.`,
            `MALFORMED_${condition}_CONDITION`,
            {
                value
            }
        );
    } else if (values.length === 0) {
        throw new WebinyError(
            `Trying to run filtering with "${condition}", but the value sent is empty array.`,
            `MALFORMED_${condition}_CONDITION`,
            {
                value
            }
        );
    }
    return values;
};

const getPopulated = (
    query: ElasticsearchBoolQueryConfig
): Partial<ElasticsearchBoolQueryConfig> => {
    const result: Partial<ElasticsearchBoolQueryConfig> = {};
    let key: keyof ElasticsearchBoolQueryConfig;
    for (key in query) {
        const value = query[key];
        if (value === undefined || (Array.isArray(value) && value.length === 0)) {
            continue;
        }
        /**
         * TODO figure out better types.
         */
        // @ts-ignore
        result[key] = value;
    }
    return result;
};

interface ApplyFilteringParams {
    fields: ModelFields;
    where: CmsEntryListWhere;
    query: ElasticsearchBoolQueryConfig;
    operatorPlugins: ElasticsearchQueryBuilderOperatorPlugins;
    searchPlugins: ElasticsearchQuerySearchValuePlugins;
    plugins: PluginsContainer;
}
export const applyFiltering = (params: ApplyFilteringParams): void => {
    const { where, query, operatorPlugins, searchPlugins, fields, plugins } = params;

    const createFieldPath = createFieldPathFactory({
        plugins: searchPlugins
    });

    for (const key in where) {
        const value = where[key];
        /**
         * We always skip if no value is defined.
         * Only skip undefined value, null is valid.
         */
        if (value === undefined) {
            continue;
        }
        //
        /**
         * When we are running with AND, the "value" MUST be an array.
         */
        else if (key === "AND") {
            const values = getValues(value, "AND");

            const childQuery = createBaseQuery();
            for (const childWhere of values) {
                applyFiltering({
                    query: childQuery,
                    where: childWhere,
                    operatorPlugins,
                    searchPlugins,
                    fields,
                    plugins
                });
            }
            query.must.push({
                bool: getPopulated(childQuery)
            });
            /**
             * Skip everything after running AND part.
             */
            continue;
        }
        //
        /**
         * When we are running with OR, the "value" must be an array.
         */
        else if (key === "OR") {
            const values = getValues(value, "OR");

            const childQuery = createBaseQuery();
            for (const childWhere of values) {
                applyFiltering({
                    query: childQuery,
                    where: childWhere,
                    operatorPlugins,
                    searchPlugins,
                    fields,
                    plugins
                });
            }
            query.should.push({
                bool: getPopulated(childQuery)
            });
            /**
             * Skip everything after running OR part.
             */
            continue;
        }
        /**
         *
         */
        const { field: fieldId, operator } = parseWhereKey(key);

        const field = fields[fieldId];
        if (!field) {
            throw new WebinyError(`There is no field "${fieldId}".`);
        }
        const { isSearchable } = field;
        if (!isSearchable) {
            throw new WebinyError(`Field "${fieldId}" is not searchable.`);
        }

        /**
         * There is a possibility that value is an object.
         * In that case, check if field is ref field and continue a bit differently.
         */
        if (isRefFieldFiltering({ key, value, field })) {
            applyFiltering({
                query,
                where: {
                    ...(value as any)
                },
                searchPlugins,
                operatorPlugins,
                fields,
                plugins
            });
            continue;
        }

        const plugin = operatorPlugins[operator];
        if (!plugin) {
            throw new WebinyError("Operator plugin missing.", "PLUGIN_MISSING", {
                operator
            });
        }

        const transformedValue = transformValueForSearch({
            plugins: searchPlugins,
            field: field.field,
            value
        });

        const keyword = hasKeyword(field);
        plugin.apply(query, {
            name: field.field.fieldId,
            basePath: createFieldPath({
                modelField: field,
                parentPath: field.isSystemField ? null : "values",
                value: transformedValue,
                key
            }),
            path: createFieldPath({
                modelField: field,
                value: transformedValue,
                parentPath: field.isSystemField ? null : "values",
                keyword,
                key
            }),
            value: transformedValue,
            keyword
        });
    }
};
