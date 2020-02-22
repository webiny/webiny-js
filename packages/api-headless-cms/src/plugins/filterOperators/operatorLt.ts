export default {
    name: "cms-find-filter-operator-lt",
    type: "cms-find-filter-operator",
    operator: "lt",
    createCondition({ value, context }) {
        if (context.cms.manage) {
            return { value: { $lt: value } };
        }

        return {
            value: { $lt: value },
            locale: context.cms.locale.id
        };
    }
};
