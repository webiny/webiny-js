export default {
    name: "cms-headless-filter-operator-lte",
    type: "cms-headless-filter-operator",
    operator: "lte",
    createCondition({ value, context }) {
        if (context.cms.headlessManage) {
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
