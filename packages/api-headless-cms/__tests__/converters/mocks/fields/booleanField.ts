import { createModelField } from "~tests/converters/mocks/utils";

export const createBooleanField = () => {
    return createModelField({
        fieldId: "isImportant",
        type: "boolean"
    });
};

export const createBooleanFieldUndefined = () => {
    return createModelField({
        fieldId: "isImportantUndefined",
        type: "boolean"
    });
};

export const createBooleanFieldEmpty = () => {
    return createModelField({
        fieldId: "isImportantEmpty",
        type: "boolean"
    });
};
