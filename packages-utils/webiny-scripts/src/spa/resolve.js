import _ from "lodash";

export default (resolve = {}) => {
    return _.merge(
        {},
        {
            alias: {}
        },
        resolve
    );
};
