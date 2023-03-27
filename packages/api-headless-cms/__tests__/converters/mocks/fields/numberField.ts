import { createModelField } from "~tests/converters/mocks/utils";

export const createNumberField = () => {
    return createModelField({
        fieldId: "age",
        type: "number"
    });
};
export const createNumberFieldUndefined = () => {
    return createModelField({
        fieldId: "ageUndefined",
        type: "number"
    });
};

export const createNumberFieldEmpty = () => {
    return createModelField({
        fieldId: "ageEmpty",
        type: "number"
    });
};
