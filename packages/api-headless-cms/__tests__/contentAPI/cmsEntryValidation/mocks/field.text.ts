import { createField, CreateFieldInput } from "./field.base";

export const createTextField = (params: Partial<CreateFieldInput> = {}) => {
    return createField({
        id: "title",
        type: "text",
        fieldId: "title",
        label: "Title",
        ...params
    });
};
