export default {
    name: "cms-find-filter-operator-gt",
    type: "cms-find-filter-operator",
    operator: "gt",
    createCondition({ value, context }) {
        if (context.cms.manage) {
            return { $elemMatch: { value: { $gt: value } } };
        }

        return {
            $elemMatch: {
                value: { $gt: value },
                locale: context.cms.locale.id
            }
        };
    }
};
