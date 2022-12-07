import WebinyError from "@webiny/error";
import { CmsEntryListWhere, CmsModel } from "@webiny/api-headless-cms/types";
import { ModelFields } from "~/operations/entry/elasticsearch/types";
import { PluginsContainer } from "@webiny/plugins";
import { ElasticsearchBoolQueryConfig } from "@webiny/api-elasticsearch/types";
import { createSearchPluginList } from "~/operations/entry/elasticsearch/plugins/search";
import { createOperatorPluginList } from "~/operations/entry/elasticsearch/plugins/operator";
import { createBaseQuery } from "~/operations/entry/elasticsearch/initialQuery";
import { parseWhereKey } from "@webiny/api-elasticsearch";
import { getValues } from "./values";
import { getPopulated } from "./populated";
import { createApplyFiltering } from "./applyFiltering";
import { isRefFieldFiltering } from "~/operations/entry/elasticsearch/filtering/isRefFieldFiltering";

export interface CreateExecParams {
    model: CmsModel;
    fields: ModelFields;
    plugins: PluginsContainer;
}
export interface ExecParams {
    where: CmsEntryListWhere;
    query: ElasticsearchBoolQueryConfig;
}
export interface CreateExecFilteringResponse {
    (params: ExecParams): void;
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
        plugins,
        locale: model.locale
    });

    const applyFiltering = createApplyFiltering({
        operatorPlugins,
        searchPlugins
    });

    const execFiltering = (params: ExecParams) => {
        const { where: initialWhere, query } = params;
        /**
         * No point in continuing if no "where" conditions exist.
         */
        if (Object.keys(initialWhere).length === 0) {
            return;
        }
        const where = {
            ...initialWhere
        };

        for (const key in where) {
            const value = where[key] as unknown as any;
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
                const childWhereList = getValues(value, "AND");

                // const childQuery = createBaseQuery();
                /**
                 * Each of the conditions MUST produce it's own filter section.
                 */
                for (const childWhere of childWhereList) {
                    execFiltering({
                        query: query,
                        where: childWhere
                    });
                }
                // const childQueryBool = getPopulated(childQuery);
                // if (Object.keys(childQueryBool).length === 0) {
                //     continue;
                // }
                // query.filter.push({
                //     bool: childQueryBool
                // });

                continue;
            }
            //
            /**
             * When we are running with OR, the "value" must be an array.
             */
            else if (key === "OR") {
                const childWhereList = getValues(value, "OR");
                /**
                 * Each of the conditions MUST produce it's own should section.
                 */
                const should: any[] = [];
                for (const childWhere of childWhereList) {
                    const childQuery = createBaseQuery();
                    execFiltering({
                        query: childQuery,
                        where: childWhere
                    });
                    const childQueryBool = getPopulated(childQuery);
                    if (Object.keys(childQueryBool).length === 0) {
                        continue;
                    }
                    should.push({
                        bool: {
                            ...childQueryBool
                        }
                    });
                }
                if (should.length === 0) {
                    continue;
                }
                query.filter.push({
                    bool: {
                        should,
                        minimum_should_match: 1
                    }
                });
                /**
                 * If there are any should, minimum to have is 1.
                 * Of course, do not override if it's already set.
                 */
                if (query.should.length > 0 && !query.minimum_should_match) {
                    query.minimum_should_match = 1;
                }

                continue;
            }
            const { field: whereFieldId, operator } = parseWhereKey(key);

            let fieldId: string = whereFieldId;

            /**
             * TODO This will be required until the storage operations receive the fieldId instead of field storageId.
             * TODO For this to work without field searching, we need to refactor how the query looks like.
             *
             * Storage operations should NEVER receive an field storageId, only alias - fieldId.
             */
            const cmsModelField = model.fields.find(f => f.fieldId === fieldId);
            if (!cmsModelField && !fields[fieldId]) {
                throw new WebinyError(`There is no CMS Model Field field "${fieldId}".`);
            } else if (cmsModelField) {
                fieldId = cmsModelField.fieldId;
            }

            const field = fields[fieldId];

            if (!field) {
                throw new WebinyError(`There is no field "${fieldId}".`);
            }

            if (!field.isSearchable) {
                throw new WebinyError(`Field "${field.field.fieldId}" is not searchable.`);
            }

            /**
             * There is a possibility that value is an object.
             * In that case, check if field is ref field and continue a bit differently.
             */
            if (isRefFieldFiltering({ key, value, field })) {
                /**
                 * We need to go through each key in where[key] to determine the filters.
                 */
                for (const whereKey in value) {
                    const { operator } = parseWhereKey(whereKey);
                    applyFiltering({
                        query,
                        field,
                        operator,
                        key: whereKey,
                        value: value[whereKey]
                    });
                }
                continue;
            }

            applyFiltering({
                key,
                value,
                query,
                field,
                operator
            });
        }
    };

    return execFiltering;
};
