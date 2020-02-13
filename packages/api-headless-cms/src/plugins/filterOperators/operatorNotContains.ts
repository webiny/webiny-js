export default {
    name: "cms-find-filter-operator-not-contains",
    type: "cms-find-filter-operator",
    operator: "not_contains",
    createCondition({ value, context }) {
        if (context.cms.manage) {
            return {
                $not: { $elemMatch: { value: { $regex: `.*${value}.*`, $options: "i" } } }
            };
        }

        return {
            $not: {
                $elemMatch: {
                    value: { $regex: `.*${value}.*`, $options: "i" },
                    locale: context.cms.locale.id
                }
            }
        };
    }
};
