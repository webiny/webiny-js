import { Sort as esSort } from "@webiny/api-elasticsearch/types";
import { createSort, ElasticsearchFieldPlugin } from "@webiny/api-elasticsearch";
import { PluginsContainer } from "@webiny/plugins";
import { CmsEntryListSort, CmsModel } from "@webiny/api-headless-cms/types";
import { ModelFields } from "./types";
import { hasKeyword } from "~/operations/entry/elasticsearch/keyword";
import { createSearchPluginList } from "~/operations/entry/elasticsearch/plugins/search";
import { createFieldPathFactory } from "~/operations/entry/elasticsearch/filtering/path";

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
            if (field.parents.length > 0) {
                return plugins;
            }
            const { fieldId, storageId } = field.field;

            fieldIdToStorageIdIdMap[fieldId] = fieldId;

            const { path } = createFieldPath({
                key: storageId,
                field,
                value: "",
                keyword: false
            });
            /**
             * Plugins must be stored with fieldId as key because it is later used to find the sorting plugin.
             */
            plugins[fieldId] = new ElasticsearchFieldPlugin({
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
            const matched = value.match(/^([a-zA-Z-0-9_]+)_(ASC|DESC)$/);
            if (!matched) {
                return null;
            }
            const [, fieldId, order] = matched;
            if (fieldIdToStorageIdIdMap[fieldId]) {
                return `${fieldIdToStorageIdIdMap[fieldId]}_${order}`;
            }

            return value;
        })
        .filter(Boolean) as string[];
    return createSort({
        fieldPlugins: sortPlugins,
        sort: transformedSort
    });
};
