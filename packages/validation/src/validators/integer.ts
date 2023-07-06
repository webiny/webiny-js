import isInteger from "lodash/isInteger";
import ValidationError from "~/validationError";

export default (value: any) => {
    if (!value) {
        return;
    }

    if (isInteger(value)) {
        return;
    }

    throw new ValidationError("Value needs to be an integer.");
};
