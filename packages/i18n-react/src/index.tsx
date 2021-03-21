import trim from "lodash/trim";
import has from "lodash/has";
import React from "react";
import { Processor } from "@webiny/i18n/types";

declare global {
    // eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "i18n-text": {
                children?: React.ReactNode;
            };

            "i18n-text-part": {
                key?: any;
                children?: React.ReactNode;
            };
        }
    }
}

const processTextPart = (part: string, values: any, modifiers): any => {
    if (!part.startsWith("{")) {
        return part;
    }

    part = trim(part, "{}");

    const parts = part.split("|");

    const [variable, modifier] = parts;

    if (!has(values, variable)) {
        return variable;
    }

    let value = values[variable];
    if (modifier) {
        const parameters = modifier.split(":");
        const name = parameters.shift();
        if (modifiers[name]) {
            const modifier = modifiers[name];
            value = modifier.execute(value, parameters);
        }
    }

    return value;
};

export default {
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
        // @ts-ignore
        return (
            <i18n-text>
                {parts.map((part, index) => (
                    <i18n-text-part key={index}>
                        {processTextPart(part, data.values, data.i18n.modifiers)}
                    </i18n-text-part>
                ))}
            </i18n-text>
        );
    }
} as Processor;
