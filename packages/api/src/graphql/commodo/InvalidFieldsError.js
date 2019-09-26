// @flow
import each from "lodash/each";
import get from "lodash/get";
import { WithFieldsError } from "@commodo/fields";

function formatInvalidFields(invalidFields, prefix = "") {
    const formatted = {};
    each(invalidFields, ({ code, data, message }, name) => {
        if (code !== WithFieldsError.VALIDATION_FAILED_INVALID_FIELDS) {
            return;
        }

        const path = prefix ? `${prefix}.${name}` : name;

        if (Array.isArray(data)) {
            return each(data, (err, index) => {
                const {
                    data: { invalidFields },
                    message
                } = err;
                if (!invalidFields) {
                    formatted[`${path}.${index}`] = message;
                    return;
                }

                return Object.assign(
                    formatted,
                    formatInvalidFields(invalidFields, `${path}.${index}`)
                );
            });
        }

        formatted[path] = get(data, "message", message);
    });

    return formatted;
}

class InvalidFieldsError extends WithFieldsError {
    static from(error: WithFieldsError) {
        const { message, code } = error;

        let data: Object = (error.data: any);
        data.invalidFields = formatInvalidFields(get(error, "data.invalidFields", {}));

        return new InvalidFieldsError(message, code, data);
    }
}

export default InvalidFieldsError;
