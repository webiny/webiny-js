import { CmsFindFilterOperator, CmsContext, CmsContentModel } from "@webiny/api-headless-cms/types";
import { WhereCondition } from "./parseWhere";
import { Sorter } from "./parseSort";

interface CreateFindParameters {
    model: CmsContentModel;
    where: WhereCondition[];
    sort?: Sorter[];
    context: CmsContext;
}

export const createFindParameters = ({
    model,
    where,
    sort = [],
    context
}: CreateFindParameters): { [key: string]: any } => {
    const filterOperators = context.plugins.byType<CmsFindFilterOperator>(
        "cms-find-filter-operator"
    );

    // Sort conditions alphabetically
    where = where.sort((a, b) => a.fieldId.localeCompare(b.fieldId));

    // Get a list of unique fields
    const allFields = [
        ...new Set([...where.map(w => w.fieldId), ...sort.map(s => s.fieldId)])
    ].sort();

    function createCondition({ fieldId, operator, value }: WhereCondition) {
        const operatorPlugin = filterOperators.find(pl => pl.operator === operator);

        if (!operatorPlugin) {
            return;
        }

        const field = model.fields.find(f => f.fieldId === fieldId);
        const searchField = `v${allFields.indexOf(fieldId)}`;
        const condition = operatorPlugin.createCondition({
            fieldId: searchField,
            field,
            value,
            context
        });

        return { [searchField]: condition };
    }

    const conditions = where.map(filter => createCondition(filter)).filter(Boolean);

    const sorters = sort.reduce((acc, item) => {
        const sortField = `v${allFields.indexOf(item.fieldId)}`;
        acc[sortField] = item.direction;
        return acc;
    }, {});

    // Make sure the field being sorted has a non-null value
    Object.keys(sorters).forEach(key => {
        conditions.push({ [key]: { $ne: null } });
    });

    if (!allFields.length) {
        return { query: { fields: "id", model: model.modelId }, sort: {} };
    }

    return {
        query: {
            model: model.modelId,
            fields: allFields.join(","),
            $and: conditions
        },
        sort: sorters
    };
};
