export default {
    name: "cms-find-filter-operator-gte",
    type: "cms-find-filter-operator",
    operator: "gte",
    createCondition({ value, context }) {
        if (context.cms.manage) {
            return { $elemMatch: { value: { $gte: value } } };
        }

        return {
            $elemMatch: {
                value: { $gte: value },
                locale: context.cms.locale.id
            }
        };
    }
};
