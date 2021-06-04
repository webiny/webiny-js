import { get } from "dot-prop-immutable";

function convertToType(value, type) {
    switch (type) {
        case "Number":
            return value.includes(".") ? parseFloat(value) : parseInt(value);
        case "Boolean":
            return value === "true";
        default:
            return value;
    }
}

export function interpolateVariables(variables, values) {
    return variables.reduce((all, variable) => {
        let value = variable.value;
        if (value.includes("${")) {
            const matches = Array.from(variable.value.matchAll(/\${([a-zA-Z.]+)}/g));
            for (const match of matches) {
                value = value.replace(match[0], get(values, match[1]));
            }
            all[variable.name] = value;
        } else {
            all[variable.name] = convertToType(value, variable.type);
        }

        return all;
    }, {});
}
