// @flow
import _ from "lodash";

const traverse = (output: Object, apiPermissionsToMerge: Object, path = "api") => {
    // Let's recursively traverse the whole object.
    for (let key in apiPermissionsToMerge) {
        const value = apiPermissionsToMerge[key];
        if (value === true) {
            _.set(output, `${path}.${key}`, true);
            continue;
        }

        if (Array.isArray(value)) {
            value.forEach(field => {
                _.set(output, `${path}.${key}.${field}`, true);
            });
            continue;
        }

        traverse(output, value, path + "." + key);
    }
};

const apiMerger = (output: Object, apiPermissionsToMerge: Object) => {
    if (output["api"] === "*") {
        return;
    }

    if (apiPermissionsToMerge === "*") {
        output["api"] = "*";
        return;
    }

    if (!output["api"]) {
        output["api"] = {};
    }

    traverse(output, apiPermissionsToMerge);
};

export default apiMerger;
