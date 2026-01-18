import WebinyError from "@webiny/error";
import type { CmsEntryListWhere, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { ModelFields } from "~/operations/entry/elasticsearch/types.js";
import type { PluginsContainer } from "@webiny/plugins";
import type { ElasticsearchBoolQueryConfig, Query } from "@webiny/api-elasticsearch/types.js";
import { createSearchPluginList } from "~/operations/entry/elasticsearch/plugins/search.js";
import { createOperatorPluginList } from "~/operations/entry/elasticsearch/plugins/operator.js";
import { createBaseQuery } from "~/operations/entry/elasticsearch/initialQuery.js";
import { parseWhereKey } from "@webiny/api-elasticsearch";
import { getWhereValues } from "./values.js";
import { getPopulated } from "./populated.js";
import { createApplyFiltering } from "./applyFiltering.js";
import { CmsEntryFilterPlugin } from "~/plugins/CmsEntryFilterPlugin.js";
import { assignMinimumShouldMatchToQuery } from "~/operations/entry/elasticsearch/assignMinimumShouldMatchToQuery.js";
import { getBaseFieldType } from "@webiny/api-headless-cms/utils/getBaseFieldType.js";

export interface CreateExecParams {
    model: CmsModel;
    fields: ModelFields;
    plugins: PluginsContainer;
}
export interface IExecParams {
    where: CmsEntryListWhere;
    query: ElasticsearchBoolQueryConfig;
    isValues?: boolean;
}
export interface CreateExecFilteringResponse {
    (params: IExecParams): void;
}
export const createExecFiltering = (params: CreateExecParams): CreateExecFilteringResponse => {
    const { fields, plugins, model } = params;

    /**
     * We need the search plugins as key -> plugin value, so it is easy to find plugin we need, without iterating through array.
     */
    const searchPlugins = createSearchPluginList({
        plugins
    });
    /**
     * We need the operator plugins, which we execute on our where conditions.
     */
    const operatorPlugins = createOperatorPluginList({
        plugins
    });

    const applyFiltering = createApplyFiltering({
        operatorPlugins,
        searchPlugins
    });

    const filteringPlugins = plugins
        .byType<CmsEntryFilterPlugin>(CmsEntryFilterPlugin.type)
        .reduce<Record<string, CmsEntryFilterPlugin>>((collection, plugin) => {
            collection[plugin.fieldType] = plugin;

            return collection;
        }, {});

    const getFilterPlugin = (type: string) => {
        const fieldType = getBaseFieldType({
            type
        });

        const plugin = filteringPlugins[fieldType] || filteringPlugins["*"];
        if (plugin) {
            return plugin;
        }
        throw new WebinyError(
            `There is no filtering plugin for the given field type "${fieldType}".`,
            "FILTERING_PLUGIN_ERROR",
            {
                fieldType
            }
        );
    };

    const execFiltering = (params: IExecParams) => {
        const { where: initialWhere, query, isValues = false } = params;
        /**
         * No point in continuing if no "where" conditions exist.
         */
        const keys = Object.keys(initialWhere);
        if (keys.length === 0) {
            return;
        }
        const where = structuredClone(initialWhere);

        for (const key in where) {
            const value = where[key as keyof typeof where];
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
                const childWhereList = getWhereValues(value, "AND");

                const childQuery = createBaseQuery();

                for (const childWhere of childWhereList) {
                    execFiltering({
                        query: childQuery,
                        where: childWhere,
                        isValues
                    });
                }
                const childQueryBool = getPopulated(childQuery);
                if (Object.keys(childQueryBool).length === 0) {
                    continue;
                }
                query.filter.push({
                    bool: childQueryBool
                });

                continue;
            }
            //
            /**
             * When we are running with OR, the "value" must be an array.
             */
            else if (key === "OR") {
                const childWhereList = getWhereValues(value, "OR");
                /**
                 * Each of the conditions MUST produce it's own should section.
                 */
                const should: Query[] = [];
                for (const childWhere of childWhereList) {
                    const childQuery = createBaseQuery();
                    execFiltering({
                        query: childQuery,
                        where: childWhere,
                        isValues
                    });
                    const childQueryBool = getPopulated(childQuery);
                    if (Object.keys(childQueryBool).length === 0) {
                        continue;
                    }
                    should.push({
                        bool: childQueryBool
                    });
                }
                if (should.length === 0) {
                    continue;
                }
                query.should.push(...should);
                /**
                 * If there are any should, minimum to have is 1.
                 * Of course, do not override if it's already set.
                 */
                assignMinimumShouldMatchToQuery({
                    query
                });
                continue;
            } else if (key === "values") {
                execFiltering({
                    query,
                    where: where[key] as CmsEntryListWhere,
                    isValues: true
                });
                continue;
            }
            const { field: whereFieldId, operator } = parseWhereKey(key);

            let fieldId: string = isValues ? `values.${whereFieldId}` : whereFieldId;

            /**
             * TODO This will be required until the storage operations receive the fieldId instead of field storageId.
             * TODO For this to work without field searching, we need to refactor how the query looks like.
             *
             * Storage operations should NEVER receive an field storageId, only alias - fieldId.
             */
            const cmsModelField = model.fields.find(f => f.fieldId === fieldId);
            if (!cmsModelField && !fields[fieldId]) {
                throw new WebinyError(`There is no CMS Model Field "${fieldId}".`);
            } else if (cmsModelField) {
                fieldId = cmsModelField.fieldId;
            }

            const field = fields[fieldId];
            if (!field) {
                throw new WebinyError(`There is no field "${fieldId}".`, "EXEC_FILTERING_ERROR");
            }
            const filterPlugin = getFilterPlugin(field.type);

            filterPlugin.exec({
                applyFiltering,
                getFilterPlugin,
                key,
                value,
                operator,
                field,
                fields,
                query
            });
        }
    };

    return execFiltering;
};
