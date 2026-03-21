import type { Sort as esSort } from "@webiny/api-opensearch/types.js";
import { createSort, OpenSearchFieldPlugin as ElasticsearchFieldPlugin } from "@webiny/api-opensearch";
import type { PluginsContainer } from "@webiny/plugins";
import type { CmsEntryListSort, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { ModelFields } from "./types.js";
import { hasKeyword } from "~/operations/entry/elasticsearch/keyword.js";
import { createSearchPluginList } from "~/operations/entry/elasticsearch/plugins/search.js";
import { createFieldPathFactory } from "~/operations/entry/elasticsearch/filtering/path.js";
import { NoValueContainer } from "~/values/NoValueContainer.js";

interface IMatchFieldResponse {
    fieldId: string;
    isValues: boolean;
    order: "ASC" | "DESC";
}

const matchField = (input: string): IMatchFieldResponse | null => {
    const valuesMatch = input.match(/^values_([a-zA-Z-0-9_]+)_(ASC|DESC)$/);
    if (valuesMatch) {
        const [, fieldId, order] = valuesMatch;
        return {
            fieldId,
            isValues: true,
            order: order as "ASC" | "DESC"
        };
    }
    const nonValues = input.match(/^([a-zA-Z-0-9_]+)_(ASC|DESC)$/);
    if (!nonValues) {
        return null;
    }
    const [, fieldId, order] = nonValues;
    return {
        fieldId,
        isValues: false,
        order: order as "ASC" | "DESC"
    };
};

interface Params {
    plugins: PluginsContainer;
    sort?: CmsEntryListSort;
    modelFields: ModelFields;
    model: CmsModel;
}

export const createElasticsearchSort = (params: Params): esSort => {
    const { sort, modelFields, plugins } = params;

    if (!sort || sort.length === 0) {
        return [
            {
                ["id.keyword"]: {
                    order: "asc"
                }
            }
        ];
    }

    const searchPlugins = createSearchPluginList({
        plugins
    });

    const createFieldPath = createFieldPathFactory({
        plugins: searchPlugins
    });

    const fieldIdToStorageIdIdMap: Record<string, string> = {};

    const sortPlugins = Object.values(modelFields).reduce<Record<string, ElasticsearchFieldPlugin>>(
        (plugins, field) => {
            /**
             * We do not support sorting by nested fields.
             */
            const isValues = field.parents.length === 1 && field.parents[0].fieldId === "values";
            if (field.parents.length > 0 && !isValues) {
                return plugins;
            }

            const fieldId = field.field.fieldId;
            const fieldIdPath = isValues ? `values.${fieldId}` : fieldId;

            fieldIdToStorageIdIdMap[fieldIdPath] = fieldIdPath;

            const { path } = createFieldPath({
                key: field.field.storageId,
                field,
                value: NoValueContainer.create(),
                keyword: false,
                originalValue: NoValueContainer.create()
            });
            /**
             * Plugins must be stored with fieldId as key because it is later used to find the sorting plugin.
             */
            plugins[fieldIdPath] = new ElasticsearchFieldPlugin({
                unmappedType: field.unmappedType,
                keyword: hasKeyword(field),
                sortable: field.sortable,
                searchable: field.searchable,
                field: fieldId,
                path
            });
            return plugins;
        },
        {
            ["*"]: new ElasticsearchFieldPlugin({
                field: ElasticsearchFieldPlugin.ALL,
                keyword: false
            })
        }
    );

    const transformedSort = sort
        .map(value => {
            const matched = matchField(value);
            if (!matched) {
                return null;
            }
            const { fieldId, order, isValues } = matched;
            const key = isValues ? `values.${fieldId}` : fieldId;
            if (fieldIdToStorageIdIdMap[key]) {
                return `${fieldIdToStorageIdIdMap[key]}_${order}`;
            }

            return value;
        })
        .filter(Boolean) as string[];
    return createSort({
        fieldPlugins: sortPlugins,
        sort: transformedSort
    });
};
