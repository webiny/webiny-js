import { createModelField } from "~tests/converters/mocks/utils";

export const createFileField = () => {
    return createModelField({
        fieldId: "image",
        type: "file"
    });
};
export const createFileFieldUndefined = () => {
    return createModelField({
        fieldId: "imageUndefined",
        type: "file"
    });
};
export const createFileFieldMultiple = () => {
    return createModelField({
        fieldId: "images",
        type: "file",
        multipleValues: true
    });
};
export const createFieldFieldMultipleUndefined = () => {
    return createModelField({
        fieldId: "imagesUndefined",
        type: "file",
        multipleValues: true
    });
};
