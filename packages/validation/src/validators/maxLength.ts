import ValidationError from "./../validationError";

export default (value: any, params: Array<string>) => {
    if (!value) {
        return;
    }

    let lengthOfValue = null;
    if (Array.isArray(value)) {
        lengthOfValue = value.length;
    } else if (typeof value === "object") {
        lengthOfValue = Object.keys(value).length;
    }

    if (lengthOfValue === null || lengthOfValue <= params[0]) {
        return;
    }

    if (typeof value === "string") {
        throw new ValidationError("Value requires " + params[0] + " characters at most.");
    }
    throw new ValidationError("Value requires " + params[0] + " items at most.");
};
