// @flow
import _ from "lodash";
import React from "react";
// TODO: flow - not any, return react component here!
const processTextPart = (part: string, values: Object, modifiers): any => {
    if (!_.startsWith(part, "{")) {
        return part;
    }

    part = _.trim(part, "{}");
    part = part.split("|");

    let [variable, modifier] = part;

    if (!_.has(values, variable)) {
        return variable;
    }

    let value = values[variable];
    if (modifier) {
        let parameters = modifier.split(":");
        let name = parameters.shift();
        if (modifiers[name]) {
            const modifier = modifiers[name];
            value = modifier.execute(value, parameters);
        }
    }

    return value;
};

export default {
    name: "react",
    canExecute(data: { values: Object }) {
        for (let key in data.values) {
            const value = data.values[key];
            if (React.isValidElement(value)) {
                return true;
            }
        }

        return false;
    },
    execute(data: { values: Object, translation: string, i18n: Object }) {
        const parts = data.translation.split(/({.*?})/);
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
};
