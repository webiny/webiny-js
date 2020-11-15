import each from "lodash.foreach";
import get from "lodash.get";
import { WithFieldsError } from "@commodo/fields";

function formatInvalidFields(invalidFields, prefix = "", formattedErrors) {
    each(invalidFields, ({ code, data, message }, name) => {
        const path = prefix ? `${prefix}.${name}` : name;

        if (code === WithFieldsError.VALIDATION_FAILED_INVALID_FIELDS) {
            formatInvalidFields(data.invalidFields, path, formattedErrors);
            return;
        }

        if (code === WithFieldsError.VALIDATION_FAILED_INVALID_FIELD) {
            if (Array.isArray(data)) {
                return each(data, (err, index) => {
                    const {
                        data: { invalidFields },
                        message
                    } = err;
                    if (!invalidFields) {
                        formattedErrors[`${path}.${index}`] = message;
                        return;
                    }

                    formatInvalidFields(invalidFields, `${path}.${index}`, formattedErrors);
                    return;
                });
            }

            formattedErrors[path] = get(data, "message", message);
        }
    });
}

class InvalidFieldsError extends WithFieldsError {
    static from(error: typeof WithFieldsError) {
        const { message, code } = error;

        const data = error.data;
        const formattedErrors = {};

        formatInvalidFields(get(error, "data.invalidFields", {}), "", formattedErrors);

        data.invalidFields = formattedErrors;

        // @ts-ignore TODO: remove the ignore once we have commodo types
        return new InvalidFieldsError(message, code, data);
    }
}

export default InvalidFieldsError;
