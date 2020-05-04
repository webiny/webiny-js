import { CmsFindFilterOperator, CmsContext, CmsModel } from "@webiny/api-headless-cms/types";
import { WhereCondition } from "./parseWhere";

const fieldMap = {
    id: "revision"
};

export const createFindQuery = (
    model: CmsModel,
    where: WhereCondition[],
    context: CmsContext
): { [key: string]: any } => {
    const filterOperators = context.plugins.byType<CmsFindFilterOperator>(
        "cms-find-filter-operator"
    );

    function createCondition({ fieldId, operator, value }: WhereCondition) {
        const operatorPlugin = filterOperators.find(pl => pl.operator === operator);

        if (!operatorPlugin) {
            return;
        }

        const field = model.fields.find(f => f.fieldId === fieldId);
        const condition = operatorPlugin.createCondition({ fieldId, field, value, context });

        return { [fieldMap[fieldId] || field.fieldId]: condition };
    }

    const conditions = where.map(filter => createCondition(filter)).filter(Boolean);

    return conditions.length ? { $and: conditions } : {};
};
