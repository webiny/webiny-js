import { CmsFindFilterOperator } from "@webiny/api-headless-cms/types";

const plugin: CmsFindFilterOperator = {
    name: "cms-find-filter-operator-eq",
    type: "cms-find-filter-operator",
    operator: "eq",
    createCondition({ value }) {
        return { $eq: value }
    }
};

export default plugin;
