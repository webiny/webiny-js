import WebinyError from "@webiny/error";
import type { CmsEntryListWhere, CmsModel } from "@webiny/api-headless-cms/types/index.js";
import type { ModelFields } from "~/operations/entry/elasticsearch/types.js";
import type { PluginsContainer } from "@webiny/plugins";
import type {
    OpenSearchBoolQueryConfig,
    QueryDslQueryContainer as Query
} from "@webiny/api-opensearch/types.js";
import { createOperatorPluginList } from "~/operations/entry/elasticsearch/plugins/operator.js";
import { createBaseQuery } from "~/operations/entry/elasticsearch/initialQuery.js";
import { parseWhereKey } from "@webiny/api-opensearch";
import { getWhereValues } from "./values.js";
import { getPopulated } from "./populated.js";
import { createApplyFiltering } from "./applyFiltering.js";
import { assignMinimumShouldMatchToQuery } from "~/operations/entry/elasticsearch/assignMinimumShouldMatchToQuery.js";
import type { CmsEntryOpenSearchValueSearchRegistry } from "~/features/CmsEntryOpenSearchValueSearch/index.js";
import type { CmsEntryOpenSearchFilterRegistry } from "~/features/CmsEntryOpenSearchFilter/index.js";

export interface CreateExecParams {
    model: CmsModel;
    fields: ModelFields;
    plugins: PluginsContainer;
    valueSearchRegistry: CmsEntryOpenSearchValueSearchRegistry.Interface;
    filterRegistry: CmsEntryOpenSearchFilterRegistry.Interface;
}
export interface IExecParams {
    where: CmsEntryListWhere;
    query: OpenSearchBoolQueryConfig;
    isValues?: boolean;
}
export interface CreateExecFilteringResponse {
    (params: IExecParams): void;
}
export const createExecFiltering = (params: CreateExecParams): CreateExecFilteringResponse => {
    const { fields, plugins, model, valueSearchRegistry, filterRegistry } = params;

    const operatorPlugins = createOperatorPluginList({
        plugins
    });

    const applyFiltering = createApplyFiltering({
        operatorPlugins,
        valueSearchRegistry
    });

    const getFilter = (type: string) => {
        return filterRegistry.get(type);
    };

    const execFiltering = (params: IExecParams) => {
        const { where: initialWhere, query, isValues = false } = params;
        const keys = Object.keys(initialWhere);
        if (keys.length === 0) {
            return;
        }
        const where = structuredClone(initialWhere);

        for (const key in where) {
            const value = where[key as keyof typeof where];
            if (value === undefined) {
                continue;
            } else if (key === "AND") {
                const childWhereList = getWhereValues(value, "AND");
                const childQuery = createBaseQuery();
                for (const childWhere of childWhereList) {
                    execFiltering({ query: childQuery, where: childWhere, isValues });
                }
                const childQueryBool = getPopulated(childQuery);
                if (Object.keys(childQueryBool).length === 0) {
                    continue;
                }
                query.filter.push({ bool: childQueryBool });
                continue;
            } else if (key === "OR") {
                const childWhereList = getWhereValues(value, "OR");
                const should: Query[] = [];
                for (const childWhere of childWhereList) {
                    const childQuery = createBaseQuery();
                    execFiltering({ query: childQuery, where: childWhere, isValues });
                    const childQueryBool = getPopulated(childQuery);
                    if (Object.keys(childQueryBool).length === 0) {
                        continue;
                    }
                    should.push({ bool: childQueryBool });
                }
                if (should.length === 0) {
                    continue;
                }
                query.should.push(...should);
                assignMinimumShouldMatchToQuery({ query });
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
            const filter = getFilter(field.type);

            filter.exec({
                applyFiltering,
                getFilter,
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
