export default {
    name: "cms-find-filter-operator-lt",
    type: "cms-find-filter-operator",
    operator: "lt",
    createCondition({ value }) {
        return { $lt: value };
    }
};
