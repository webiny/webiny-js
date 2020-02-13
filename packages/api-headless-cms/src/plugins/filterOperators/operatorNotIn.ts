export default {
    name: "cms-find-filter-operator-not-in",
    type: "cms-find-filter-operator",
    operator: "not_in",
    createCondition({ fieldId, value, context }) {
        if (fieldId === "id") {
            return { $nin: value };
        }

        if (context.cms.manage) {
            return { $elemMatch: { value: { $nin: value } } };
        }

        return {
            $elemMatch: {
                value: { $nin: value },
                locale: context.cms.locale.id
            }
        };
    }
};
