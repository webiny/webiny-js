// @flow
import forOwn from "lodash/forOwn";
import isObject from "lodash/isObject";

const traverse = (obj: Object) => {
    forOwn(obj, (val, key) => {
        if (Array.isArray(val)) {
            val.forEach(el => {
                traverse(el);
            });
        } else if (isObject(val)) {
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
