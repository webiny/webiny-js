export default {
    name: "cms-find-filter-operator-gte",
    type: "cms-find-filter-operator",
    operator: "gte",
    createCondition({ value }) {
        return { $gte: value };
    }
};
