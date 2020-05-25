export default {
    name: "cms-find-filter-operator-lte",
    type: "cms-find-filter-operator",
    operator: "lte",
    createCondition({ value }) {
        return { $lte: value };
    }
};
