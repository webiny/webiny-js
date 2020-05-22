export default {
    name: "cms-find-filter-operator-in",
    type: "cms-find-filter-operator",
    operator: "in",
    createCondition({ value }) {
        return { $in: value };
    }
};
