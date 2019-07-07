export default {
    name: "cms-headless-filter-operator-gt",
    type: "cms-headless-filter-operator",
    operator: "gt",
    createCondition({ value, context }) {
        if (context.cms.headlessManage) {
            return { $elemMatch: { value: { $gt: value } } };
        }

        return {
            $elemMatch: {
                value: { $gt: value },
                locale: context.locale
            }
        };
    }
};
