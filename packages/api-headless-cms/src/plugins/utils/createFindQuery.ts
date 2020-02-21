import { CmsFindFilterOperator, CmsModel } from "@webiny/api-headless-cms/types";
import { GraphQLContext } from "@webiny/api/types";

export type FindWhere = {
    [key: string]: any;
};

export const createFindQuery = (model: CmsModel, where: FindWhere, context: GraphQLContext) => {
    const match: any = {};
    const filterOperators = context.plugins.byType<CmsFindFilterOperator>(
        "cms-find-filter-operator"
    );

    function createCondition(key) {
        const value = where[key];
        const delim = key.indexOf("_");
        const fieldId = key.substring(0, delim > 0 ? delim : undefined);
        const operator = delim > 0 ? key.substring(delim + 1) : "eq";

        const operatorPlugin = filterOperators.find(pl => pl.operator === operator);

        if (!operatorPlugin) {
            return;
        }

        const field = model.fields.find(f => f.fieldId === fieldId);
        const condition = operatorPlugin.createCondition({ fieldId, field, value, context });

        return { field: fieldId, value: condition, locale: context.cms.locale.id};
    }

    const whereKeys = Object.keys(where);

    if (whereKeys.length) {
        match.$and = [];
    }

    whereKeys.forEach(key => {
        match.$and.push(createCondition(key));
    });

    return match;
};
