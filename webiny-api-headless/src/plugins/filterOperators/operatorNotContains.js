export default {
    name: "cms-headless-filter-operator-not-contains",
    type: "cms-headless-filter-operator",
    operator: "not_contains",
    createCondition({ value, context }) {
        if (context.cms.headlessManage) {
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
