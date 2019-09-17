export default {
    name: "cms-filter-operator-gte",
    type: "cms-filter-operator",
    operator: "gte",
    createCondition({ value, context }) {
        if (context.cmsManage) {
            return { $elemMatch: { value: { $gte: value } } };
        }

        return {
            $elemMatch: {
                value: { $gte: value },
                locale: context.locale
            }
        };
    }
};
