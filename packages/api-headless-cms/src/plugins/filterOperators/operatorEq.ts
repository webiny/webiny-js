import { CmsFindFilterOperator } from "@webiny/api-headless-cms/types";

const plugin: CmsFindFilterOperator = {
    name: "cms-find-filter-operator-eq",
    type: "cms-find-filter-operator",
    operator: "eq",
    createCondition({ fieldId, value, context }) {
        if (fieldId === "id") {
            return value;
        }

        if (context.cms.manage) {
            return { $elemMatch: { value } };
        }

        return { $elemMatch: { value, locale: context.cms.locale.id } };
    }
};

export default plugin;