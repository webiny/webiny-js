import get from "lodash/get";
import { I18NValue } from "@webiny/app-i18n/types";

/**
 * Receives a form input data and
 * convert value: { id: string, .... } => value: string
 * @param {Object} data
 *
 * Return form input data with value: string
 */
export const getFormattedData = data => {
    const formattedData = {};

    Object.keys(data).forEach(key => {
        const inputValue = data[key];
        const formattedInputValue = { ...inputValue };
        // format data for `Ref` input type
        if (inputValue.__typename.includes("Ref")) {
            formattedInputValue.values = inputValue.values.map((item: I18NValue) => {
                if (Array.isArray(item.value)) {
                    return {
                        ...item,
                        // Extract `id` from value
                        value: item.value.map(instance => get(instance, "id", instance))
                    };
                } else {
                    // Extract `id` from value
                    return { ...item, value: get(item.value, "id", item.value) };
                }
            });
        }

        formattedData[key] = formattedInputValue;
    });

    return formattedData;
};
