import lodashTrim from "lodash/trim";
import { Modifier, Processor } from "~/types";

const processTextPart = (
    part: string,
    values: Record<string, any>,
    modifiers: Record<string, Modifier>
): string => {
    if (part.startsWith("{") === false) {
        return part;
    }

    const parts = lodashTrim(part, "{}").split("|");

    const [variable, modifier] = parts;

    if (!values[variable]) {
        return `{${variable}}`;
    }

    const output = {
        value: values[variable]
    };

    if (modifier) {
        const parameters: string[] = modifier.split(":");
        const name = parameters.shift();
        if (!name) {
            return output.value;
        }
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
