export default {
    name: "cms-find-filter-operator-in",
    type: "cms-find-filter-operator",
    operator: "in",
    createCondition({ fieldId, value, context }) {
        if (fieldId === "id") {
            return { $in: value };
        }

        if (context.cms.manage) {
            return { $elemMatch: { value: { $in: value } } };
        }

        return {
            $elemMatch: {
                value: { $in: value },
                locale: context.cms.locale.id
            }
        };
    }
};
