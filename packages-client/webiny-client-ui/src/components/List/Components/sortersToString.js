import _ from "lodash";

export default sorters => {
    const sort = [];
    _.each(sorters, (value, field) => {
        if (value === 1) {
            sort.push(field);
        } else {
            sort.push("-" + field);
        }
    });

    return sort.length ? sort.join(",") : null;
};
