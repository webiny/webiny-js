import { CmsFindFilterOperator } from "@webiny/api-headless-cms/types";

const plugin: CmsFindFilterOperator = {
    name: "cms-find-filter-operator-contains",
    type: "cms-find-filter-operator",
    operator: "contains",
    createCondition({ value }) {
        return { $regex: `.*${value}.*`, $options: "i" };
    }
};

export default plugin;
