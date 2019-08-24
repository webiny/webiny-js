export default {
    name: "cms-headless-filter-operator-lt",
    type: "cms-headless-filter-operator",
    operator: "lt",
    createCondition({ value, context }) {
        if (context.cms.headlessManage) {
            return { $elemMatch: { value: { $lt: value } } };
        }

        return {
            $elemMatch: {
                value: { $lt: value },
                locale: context.locale
            }
        };
    }
};
