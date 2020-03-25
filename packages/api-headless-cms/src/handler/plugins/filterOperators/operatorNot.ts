export default {
    name: "cms-find-filter-operator-not",
    type: "cms-find-filter-operator",
    operator: "not",
    createCondition({ value }) {
        return { $ne: value };
    }
};
