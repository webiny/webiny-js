import { CmsFindFilterOperator } from "@webiny/api-headless-cms/types";

const plugin: CmsFindFilterOperator = {
    name: "cms-find-filter-operator-exists",
    type: "cms-find-filter-operator",
    operator: "exists",
    createCondition({value, context }) {
        return value
            ? {
                  locale: context.cms.locale.id
              }
            : { $not: { locale: context.cms.locale.id } };
    }
};

export default plugin;
