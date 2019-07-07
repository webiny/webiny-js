export default {
    name: "cms-headless-filter-operator-gte",
    type: "cms-headless-filter-operator",
    operator: "gte",
    createCondition({ value, context }) {
        if (context.cms.headlessManage) {
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
