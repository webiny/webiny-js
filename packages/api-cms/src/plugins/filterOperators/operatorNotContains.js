export default {
    name: "cms-filter-operator-not-contains",
    type: "cms-filter-operator",
    operator: "not_contains",
    createCondition({ value, context }) {
        if (context.cmsManage) {
            return {
                $not: { $elemMatch: { value: { $regex: `.*${value}.*`, $options: "i" } } }
            };
        }

        return {
            $not: {
                $elemMatch: {
                    value: { $regex: `.*${value}.*`, $options: "i" },
                    locale: context.locale
                }
            }
        };
    }
};
