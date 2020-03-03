export default {
    name: "cms-find-filter-operator-gt",
    type: "cms-find-filter-operator",
    operator: "gt",
    createCondition({ value }) {
        return { $gt: value };
    }
};
