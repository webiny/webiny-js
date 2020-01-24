import forOwn from "lodash.forown";
import isObject from "lodash.isobject";

const traverse = obj => {
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
