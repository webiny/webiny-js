import { createModelField } from "~tests/converters/mocks/utils";

export const createLongTextField = () => {
    return createModelField({
        fieldId: "description",
        type: "long-text"
    });
};

export const createLongTextFieldUndefined = () => {
    return createModelField({
        fieldId: "descriptionUndefined",
        type: "long-text"
    });
};
