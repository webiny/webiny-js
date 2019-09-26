export default {
    name: "cms-filter-operator-contains",
    type: "cms-filter-operator",
    operator: "contains",
    createCondition({ value, context }) {
        if (context.cmsManage) {
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
