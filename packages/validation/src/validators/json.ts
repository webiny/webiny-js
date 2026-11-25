import secureJsonParse from "secure-json-parse";
import ValidationError from "~/validationError.js";

export default (value: any) => {
    if (!value) {
        return;
    }

    try {
        secureJsonParse(value, {
            protoAction: "error",
            constructorAction: "error"
        });
    } catch {
        throw new ValidationError("Value needs to be a valid JSON.");
    }
};
