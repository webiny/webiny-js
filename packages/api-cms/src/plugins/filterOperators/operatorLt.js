export default {
    name: "cms-filter-operator-lt",
    type: "cms-filter-operator",
    operator: "lt",
    createCondition({ value, context }) {
        if (context.cmsManage) {
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
