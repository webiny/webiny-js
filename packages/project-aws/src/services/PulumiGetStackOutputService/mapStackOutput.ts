import get from "lodash/get.js";
import chalk from "chalk";

const { yellow } = chalk;

export const mapStackOutput = <T extends Record<string, any> = Record<string, any>>(
    output: Record<string, any>,
    map: Record<string, any>
): T => {
    const values: T = {} as T;
    const regex = /\${(.*)}/;

    Object.keys(map).forEach(key => {
        const valuePattern = map[key];
        const match = regex.exec(valuePattern);
        if (match) {
            const [replace, valuePath] = match;
            const value = get(output, valuePath);
            if (!value) {
                console.log(yellow(`Could not map "${valuePath}" to "${key}" - value missing.`));
                return;
            }
            /**
             * It is ok to expect error here.
             */
            if (typeof value === "object" && value !== null) {
                // @ts-expect-error
                values[key] = valuePattern.replace(replace, JSON.stringify(value));
            } else {
                // @ts-expect-error
                values[key] = valuePattern.replace(replace, value);
            }
        }
    });

    return values;
};
