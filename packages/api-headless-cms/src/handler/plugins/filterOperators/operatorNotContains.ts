export default {
    name: "cms-find-filter-operator-not-contains",
    type: "cms-find-filter-operator",
    operator: "not_contains",
    createCondition({ value }) {
        return {
            $not: { $regex: `.*${value}.*`, $options: "i" }
        };
    }
};
