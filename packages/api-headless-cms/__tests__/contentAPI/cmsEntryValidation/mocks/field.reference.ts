import { createField, CreateFieldInput } from "./fields";

export const createReferenceField = (params: Partial<CreateFieldInput> = {}) => {
    return createField({
        id: "category",
        type: "ref",
        fieldId: "category",
        label: "Category",
        settings: {
            modelId: "category"
        },
        ...params
    });
};
