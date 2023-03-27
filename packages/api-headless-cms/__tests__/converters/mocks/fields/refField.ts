import { createModelField } from "~tests/converters/mocks/utils";

export const createRefField = () => {
    return createModelField({
        fieldId: "category",
        type: "ref"
    });
};

export const createRefFieldUndefined = () => {
    return createModelField({
        fieldId: "categoryUndefined",
        type: "ref"
    });
};
