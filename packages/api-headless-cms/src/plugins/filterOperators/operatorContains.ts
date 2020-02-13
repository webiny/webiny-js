import { CmsFindFilterOperator } from "@webiny/api-headless-cms/types";

const plugin: CmsFindFilterOperator = {
    name: "cms-find-filter-operator-contains",
    type: "cms-find-filter-operator",
    operator: "contains",
    createCondition({ value, context }) {
        if (context.cms.manage) {
            return { $elemMatch: { value: { $regex: `.*${value}.*`, $options: "i" } } };
        }

        return {
            $elemMatch: {
                value: { $regex: `.*${value}.*`, $options: "i" },
                locale: context.cms.locale.id
            }
        };
    }
};

export default plugin;
