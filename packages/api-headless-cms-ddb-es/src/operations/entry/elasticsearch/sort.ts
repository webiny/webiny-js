import { Sort as esSort } from "elastic-ts";
import { CmsEntryElasticsearchFieldPlugin } from "~/plugins";
import { createSort } from "@webiny/api-elasticsearch";
import { PluginsContainer } from "@webiny/plugins";
import { CmsEntryListSort, CmsModel } from "@webiny/api-headless-cms/types";
import { ElasticsearchQuerySearchValuePlugins, ModelFields } from "./types";
import { hasKeyword } from "~/operations/entry/elasticsearch/keyword";
import { createFieldPath } from "./fieldPath";

interface Params {
    plugins: PluginsContainer;
    sort?: CmsEntryListSort;
    modelFields: ModelFields;
    model: CmsModel;
    searchPlugins: ElasticsearchQuerySearchValuePlugins;
}
export const createElasticsearchSort = (params: Params): esSort => {
    const { sort, modelFields, searchPlugins } = params;

    if (!sort || sort.length === 0) {
        return [];
    }

    const fieldIdToStorageIdIdMap: Record<string, string> = {};

    const sortPlugins = Object.values(modelFields).reduce<
        Record<string, CmsEntryElasticsearchFieldPlugin>
    >((plugins, field) => {
        const searchPlugin = searchPlugins[field.type];

        const { fieldId, storageId } = field.field;

        fieldIdToStorageIdIdMap[fieldId] = fieldId;
        /**
         * Plugins must be stored with fieldId as key because it is later used to find the sorting plugin.
         */
        plugins[fieldId] = new CmsEntryElasticsearchFieldPlugin({
            unmappedType: field.unmappedType,
            keyword: hasKeyword(field),
            sortable: field.isSortable,
            searchable: field.isSearchable,
            field: fieldId,
            path: createFieldPath({
                key: storageId,
                field,
                searchPlugin
            })
        });
        return plugins;
    }, {});

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
