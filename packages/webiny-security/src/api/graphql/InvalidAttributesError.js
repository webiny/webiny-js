// @flow
import _ from "lodash";
import { ModelError } from "webiny-model";

function formatInvalidAttributes(invalidAttributes, prefix = "") {
    const formatted = {};
    _.each(invalidAttributes, ({ code, data, message }, name) => {
        if (code !== "INVALID_ATTRIBUTE") {
            return;
        }

        const path = prefix ? `${prefix}.${name}` : name;

        if (Array.isArray(data)) {
            return _.each(data, (err, index) => {
                const {
                    data: { invalidAttributes },
                    message
                } = err;
                if (!invalidAttributes) {
                    formatted[`${path}.${index}`] = message;
                    return;
                }

                return Object.assign(
                    formatted,
                    formatInvalidAttributes(invalidAttributes, `${path}.${index}`)
                );
            });
        }

        formatted[path] = _.get(data, "message", message);
    });

    return formatted;
}

class InvalidAttributesError extends ModelError {
    static from(error: ModelError) {
        const { message, code } = error;

        let data: Object = (error.data: any);
        data.invalidAttributes = formatInvalidAttributes(
            _.get(error, "data.invalidAttributes", {})
        );

        return new InvalidAttributesError(message, code, data);
    }
}

export default InvalidAttributesError;
