export default {
    name: "cms-find-filter-operator-not-in",
    type: "cms-find-filter-operator",
    operator: "not_in",
    createCondition({ value }) {
        return { $nin: value };
    }
};
