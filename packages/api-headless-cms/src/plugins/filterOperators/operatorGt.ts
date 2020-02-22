export default {
    name: "cms-find-filter-operator-gt",
    type: "cms-find-filter-operator",
    operator: "gt",
    createCondition({ value, context }) {
        if (context.cms.manage) {
            return { value: { $gt: value } };
        }

        return {
            value: { $gt: value },
            locale: context.cms.locale.id
        };
    }
};
