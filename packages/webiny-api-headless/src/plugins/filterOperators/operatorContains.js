export default {
    name: "cms-headless-filter-operator-contains",
    type: "cms-headless-filter-operator",
    operator: "contains",
    createCondition({ value, context }) {
        if (context.cms.headlessManage) {
            return { $elemMatch: { value: { $regex: `.*${value}.*`, $options: "i" } } };
        }

        return {
            $elemMatch: {
                value: { $regex: `.*${value}.*`, $options: "i" },
                locale: context.locale
            }
        };
    }
};
