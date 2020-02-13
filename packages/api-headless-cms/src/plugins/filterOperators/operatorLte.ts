export default {
    name: "cms-find-filter-operator-lte",
    type: "cms-find-filter-operator",
    operator: "lte",
    createCondition({ value, context }) {
        if (context.cms.manage) {
            return { $elemMatch: { value: { $lte: value } } };
        }

        return {
            $elemMatch: {
                value: { $lte: value },
                locale: context.cms.locale.id
            }
        };
    }
};
