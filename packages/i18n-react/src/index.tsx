import React from "react";
import lodashTrim from "lodash/trim";
import { I18NDataValues, Modifier, Processor } from "@webiny/i18n/types";

declare global {
    // eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "i18n-text": {
                children?: React.ReactNode;
            };

            "i18n-text-part": {
                key?: string;
                children?: React.ReactNode;
            };
        }
    }
}

const processTextPart = (
    part: string,
    values: I18NDataValues,
    modifiers: Record<string, Modifier>
): string => {
    if (part.startsWith("{") === false) {
        return part;
    }

    part = lodashTrim(part, "{}");

    const parts: string[] = part.split("|");

    const [variable, modifier] = parts;

    if (!values[variable]) {
        return variable;
    }

    let value = values[variable];
    if (modifier) {
        const parameters = modifier.split(":");
        const name = parameters.shift();
        if (!name) {
            return value;
        }
        if (modifiers[name]) {
            const modifier = modifiers[name];
            value = modifier.execute(value, parameters);
        }
    }

    return value;
};

const processor: Processor = {
    name: "react",
    canExecute(data) {
        for (const key in data.values) {
            const value = data.values[key];
            if (React.isValidElement(value)) {
                return true;
            }
        }

        return false;
    },
    execute(data) {
        const parts = data.translation.split(/({.*?})/);
        return (
            <i18n-text>
                {parts.map((part, index) => (
                    <i18n-text-part key={String(index)}>
                        {processTextPart(part, data.values, data.i18n.modifiers)}
                    </i18n-text-part>
                ))}
            </i18n-text>
        );
    }
};
export default processor;
