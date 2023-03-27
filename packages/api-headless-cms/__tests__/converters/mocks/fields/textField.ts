import { createModelField } from "~tests/converters/mocks/utils";

export const createTextField = () => {
    return createModelField({
        fieldId: "name",
        type: "text"
    });
};

export const createTextFieldUndefined = () => {
    return createModelField({
        fieldId: "nameUndefined",
        type: "text"
    });
};

export const createTextFieldEmpty = () => {
    return createModelField({
        fieldId: "nameEmpty",
        type: "text"
    });
};
