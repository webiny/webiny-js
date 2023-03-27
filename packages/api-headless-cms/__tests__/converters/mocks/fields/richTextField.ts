import { createModelField } from "~tests/converters/mocks/utils";

export const createRichTextField = () => {
    return createModelField({
        fieldId: "body",
        type: "rich-text"
    });
};

export const createRichTextFieldUndefined = () => {
    return createModelField({
        fieldId: "bodyUndefined",
        type: "rich-text"
    });
};
