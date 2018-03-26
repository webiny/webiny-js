import React from "react";
import _ from "lodash";

const replaceVariables = (text, values) => {
    if (_.isEmpty(values)) {
        return text;
    }

    // Let's first check if we need to return pure string or JSX
    let stringOutput = true;
    _.each(values, value => {
        if (!_.isString(value) && !_.isNumber(value)) {
            stringOutput = false;
            return false;
        }
    });

    // Get text parts
    const parts = text.split(/(\{.*?\})/);

    if (stringOutput) {
        return parts.reduce((carry, part) => carry + processTextPart(part, values), "");
    }

    // Let's create a JSX output
    return parts.map((part, index) => {
        return <webiny-i18n-part key={index}>{processTextPart(part, values)}</webiny-i18n-part>;
    });
};

const processTextPart = (part, values) => {
    // If not a variable, but an ordinary text, just return it, we don't need to do any extra processing with it.
    if (!_.startsWith(part, "{")) {
        return part;
    }

    part = _.trim(part, "{}");
    part = part.split("|");

    let [variable] = part;

    if (!_.has(values, variable)) {
        return `{${variable}}`;
    }

    // Check if we have received {value: ..., format: ...} object.
    const output = { value: values[variable], format: null };

    // If variable value is an object, the it must have 'value' key set.
    // We must also be sure we are not dealing with React component.
    if (_.isPlainObject(output.value) && !React.isValidElement(output.value)) {
        if (!_.has(output.value, "value")) {
            throw Error(`Key "value" is missing for variable {${variable}}.`);
        }

        // Before assigning real value, let's check if we have a custom formatter set.
        if (_.isFunction(output.value.format)) {
            output.format = output.value.format;
        }

        output.value = output.value.value;
    }

    if (output.format) {
        return output.format(output.value);
    }

    return output.value;
};

const i18n = (text, values) => {
    return replaceVariables(text, values);
};

i18n.datetime = date => {
    return date;
};

export default i18n;
