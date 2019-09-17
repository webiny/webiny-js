export default {
    name: "cms-filter-operator-gt",
    type: "cms-filter-operator",
    operator: "gt",
    createCondition({ value, context }) {
        if (context.cmsManage) {
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
