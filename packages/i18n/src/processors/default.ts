import _ from "lodash";
import { Modifier, Processor } from "~/types";

const processTextPart = (
    part: string,
    values: Record<string, any>,
    modifiers: Record<string, Modifier>
): string => {
    if (!_.startsWith(part, "{")) {
        return part;
    }

    const parts = _.trim(part, "{}").split("|");

    const [variable, modifier] = parts;

    if (!_.has(values, variable)) {
        return `{${variable}}`;
    }

    const output = { value: values[variable] };

    if (modifier) {
        const parameters: string[] = modifier.split(":");
        const name = parameters.shift();
        if (modifiers[name]) {
            const modifier = modifiers[name];
            output.value = modifier.execute(output.value, parameters);
        }
    }

    return output.value;
};

const processor: Processor = {
    name: "default",
    canExecute(data) {
        for (const key in data.values) {
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
    execute(data) {
        const parts = data.translation.split(/({.*?})/);
        return parts.reduce(
            (carry, part) => carry + processTextPart(part, data.values, data.i18n.modifiers),
            ""
        );
    }
};

export default processor;
