export default {
    name: "cms-find-filter-operator-not",
    type: "cms-find-filter-operator",
    operator: "not",
    createCondition({ fieldId, value, context }) {
        if (fieldId === "id") {
            return { $ne: value };
        }

        if (context.cms.manage) {
            return { value: { $ne: value } };
        }

        return { value: { $ne: value }, locale: context.cms.locale.id };
    }
};
