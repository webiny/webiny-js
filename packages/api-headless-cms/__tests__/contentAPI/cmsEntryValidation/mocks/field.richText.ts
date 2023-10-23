import { createField, CreateFieldInput } from "./fields";

export const createRichTextField = (params: Partial<CreateFieldInput> = {}) => {
    return createField({
        id: "body",
        type: "rich-text",
        fieldId: "body",
        label: "Body",
        ...params
    });
};
