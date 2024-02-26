import { createField, CreateFieldInput } from "./fields";

export const createFileField = (params: Partial<CreateFieldInput> = {}) => {
    return createField({
        id: "image",
        type: "file",
        fieldId: "image",
        label: "Image",
        ...params
    });
};
