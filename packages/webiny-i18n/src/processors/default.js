// @flow
import _ from "lodash";

const processTextPart = (part: string, values: Object, modifiers): string => {
    if (!_.startsWith(part, "{")) {
        return part;
    }

    part = _.trim(part, "{}");
    part = part.split("|");

    let [variable, modifier] = part;

    if (!_.has(values, variable)) {
        return `{${variable}}`;
    }

    const output = { value: values[variable] };

    if (modifier) {
        let parameters = modifier.split(":");
        let name = parameters.shift();
        if (modifiers[name]) {
            const modifier = modifiers[name];
            output.value = modifier.execute(output.value, parameters);
        }
    }

    return output.value;
};

export default {
    name: "default",
    canExecute(data: { values: Object }) {
        for (let key in data.values) {
            const value = data.values[key];
            if (
                typeof value === "string" ||
                typeof value === "number" ||
                value === null ||
                value instanceof Date
            ) {
                continue;
            }
            return false;
        }

        return true;
    },
    execute(data: { values: Object, translation: string, i18n: Object }) {
        const parts = data.translation.split(/({.*?})/);
        return parts.reduce(
            (carry, part) => carry + processTextPart(part, data.values, data.i18n.modifiers),
            ""
        );
    }
};
