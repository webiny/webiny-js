// @flow
import _ from "lodash";

const traverse = (obj: Object) => {
    _.forOwn(obj, (val, key) => {
        if (_.isArray(val)) {
            val.forEach(el => {
                traverse(el);
            });
        } else if (_.isObject(val)) {
            traverse(val);
        } else {
            if (val === "true") {
                obj[key] = true;
            } else if (val === "false") {
                obj[key] = false;
            }
        }
    });
};

export default traverse;
