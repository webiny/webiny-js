import _ from "lodash";
import { ModelError } from "webiny-model";

class FormattedInvalidAttributesModelError extends ModelError {
    message: string;
    code: ?string;
    data: Object;
    constructor(invalidAttributesError) {
        super();
        this.message = invalidAttributesError.message;
        this.code = invalidAttributesError.code;
        this.data = {};

        FormattedInvalidAttributesModelError.format(this.data, {
            data: invalidAttributesError.data
        });
    }

    static format(output, invalidAttributes, prefix = "") {
        if (_.get(invalidAttributes, "data.invalidAttributes")) {
            return FormattedInvalidAttributesModelError.format(
                output,
                _.get(invalidAttributes, "data.invalidAttributes"),
                prefix
            );
        }

        if (Array.isArray(invalidAttributes.data)) {
            return invalidAttributes.data.forEach((item, index) => {
                FormattedInvalidAttributesModelError.format(output, item, prefix + "." + index);
            });
        }

        if (invalidAttributes.code === "INVALID_ATTRIBUTE") {
            output[prefix] = _.get(invalidAttributes, "data.message", invalidAttributes.message);
            return;
        }

        for (let name in invalidAttributes) {
            const attribute = invalidAttributes[name];
            const path = prefix ? `${prefix}.${name}` : name;

            FormattedInvalidAttributesModelError.format(output, attribute, path);
        }
    }
}

export default FormattedInvalidAttributesModelError;
