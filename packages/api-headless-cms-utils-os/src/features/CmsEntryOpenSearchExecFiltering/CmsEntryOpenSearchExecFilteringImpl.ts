import WebinyError from "@webiny/error";
import type { CmsEntryListWhere } from "@webiny/api-headless-cms/types/index.js";
import type { QueryDslQueryContainer as Query } from "@webiny/api-opensearch/types.js";
import { parseWhereKey } from "@webiny/api-opensearch";
import { createBaseQuery } from "~/operations/entry/elasticsearch/initialQuery.js";
import { assignMinimumShouldMatchToQuery } from "~/operations/entry/elasticsearch/assignMinimumShouldMatchToQuery.js";
import { CmsEntryOpenSearchFilterRegistry } from "~/features/CmsEntryOpenSearchFilter/index.js";
import { CmsEntryOpenSearchOperatorList } from "~/features/CmsEntryOpenSearchOperatorList/index.js";
import { CmsEntryOpenSearchValueTransformer } from "~/features/CmsEntryOpenSearchValueTransformer/index.js";
import { CmsEntryOpenSearchFieldPathFactory } from "~/features/CmsEntryOpenSearchFieldPathFactory/index.js";
import { CmsEntryOpenSearchExecFiltering } from "./abstractions.js";
import { getWhereValues } from "./values.js";
import { getPopulated } from "./populated.js";
import { createApplyFiltering } from "./applyFiltering.js";

interface InternalExecParams {
    where: CmsEntryListWhere;
    query: CmsEntryOpenSearchExecFiltering.Params["query"];
    isValues?: boolean;
}

export class CmsEntryOpenSearchExecFilteringClass
    implements CmsEntryOpenSearchExecFiltering.Interface
{
    public constructor(
        private readonly operatorList: CmsEntryOpenSearchOperatorList.Interface,
        private readonly valueTransformer: CmsEntryOpenSearchValueTransformer.Interface,
        private readonly fieldPathFactory: CmsEntryOpenSearchFieldPathFactory.Interface,
        private readonly filterRegistry: CmsEntryOpenSearchFilterRegistry.Interface
    ) {}

    public execute(params: CmsEntryOpenSearchExecFiltering.Params): void {
        const { model, fields, where, query } = params;

        const operators = this.operatorList.getAll();

        const applyFiltering = createApplyFiltering({
            operators,
            valueTransformer: this.valueTransformer,
            fieldPathFactory: this.fieldPathFactory
        });

        const getFilter = (type: string) => {
            return this.filterRegistry.get(type);
        };

        const execFiltering = (params: InternalExecParams) => {
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
                    throw new WebinyError(
                        `There is no field "${fieldId}".`,
                        "EXEC_FILTERING_ERROR"
                    );
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

        execFiltering({ where, query });
    }
}

export const CmsEntryOpenSearchExecFilteringImpl =
    CmsEntryOpenSearchExecFiltering.createImplementation({
        implementation: CmsEntryOpenSearchExecFilteringClass,
        dependencies: [
            CmsEntryOpenSearchOperatorList,
            CmsEntryOpenSearchValueTransformer,
            CmsEntryOpenSearchFieldPathFactory,
            CmsEntryOpenSearchFilterRegistry
        ]
    });
