export default {
    name: "cms-filter-operator-lte",
    type: "cms-filter-operator",
    operator: "lte",
    createCondition({ value, context }) {
        if (context.cmsManage) {
            return { $elemMatch: { value: { $lte: value } } };
        }

        return {
            $elemMatch: {
                value: { $lte: value },
                locale: context.locale
            }
        };
    }
};
